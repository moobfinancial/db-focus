import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { validateContact } from '@/lib/validation';
import type { Contact } from '@/types/schema';
import type { ApiResponse, PaginatedResponse } from '@/types/schema';
import multer from 'multer';
import csv from 'csv-parse';
import { Readable } from 'stream';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get paginated contacts
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, type, campaignId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where = {
      ...(req.user?.id && { userId: req.user.id }),
      ...(type && { type: String(type) }),
      ...(campaignId && { campaignId: String(campaignId) }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { phone: { contains: String(search) } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: true,
          calls: {
            orderBy: { startTime: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Contact>> = {
      success: true,
      data: {
        items: contacts,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch contacts',
        details: error,
      },
    });
  }
});

// Get contact by ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        campaign: true,
        calls: {
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contact not found',
        },
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch contact',
        details: error,
      },
    });
  }
});

// Create new contact
router.post('/', async (req, res) => {
  try {
    const validation = validateContact(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid contact data',
          details: validation.errors,
        },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        ...req.body,
        userId: req.user.id,
      },
      include: {
        campaign: true,
      },
    });

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create contact',
        details: error,
      },
    });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    const validation = validateContact(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid contact data',
          details: validation.errors,
        },
      });
    }

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        campaign: true,
      },
    });

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update contact',
        details: error,
      },
    });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contact.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete contact',
        details: error,
      },
    });
  }
});

// Bulk operations
router.post('/bulk', async (req, res) => {
  const { operation, contactIds, data } = req.body;

  try {
    switch (operation) {
      case 'delete':
        await prisma.contact.deleteMany({
          where: {
            id: { in: contactIds },
            userId: req.user.id,
          },
        });
        break;

      case 'update':
        await prisma.contact.updateMany({
          where: {
            id: { in: contactIds },
            userId: req.user.id,
          },
          data,
        });
        break;

      case 'assignCampaign':
        await prisma.contact.updateMany({
          where: {
            id: { in: contactIds },
            userId: req.user.id,
          },
          data: {
            campaignId: data.campaignId,
          },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'Invalid bulk operation',
          },
        });
    }

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform bulk operation',
        details: error,
      },
    });
  }
});

// Download CSV template
router.get('/template', (req, res) => {
  console.log('Template download request received');
  console.log('User:', req.user);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  const template = 
    'name,phone,email,notes\n' +
    'John Doe,+1234567890,john@example.com,Example note\n';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.csv');
  res.send(template);
});

// Upload CSV contacts
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('Upload request received');
  console.log('User:', req.user);
  console.log('File:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    encoding: req.file.encoding,
  } : 'Missing');
  console.log('Content Type:', req.headers['content-type']);

  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'CSV file is required'
        }
      });
    }

    // Verify file type
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File must be a CSV file'
        }
      });
    }

    // Read and clean file content
    let fileContent = req.file.buffer.toString('utf-8');
    
    // Remove BOM if present
    fileContent = fileContent.replace(/^\uFEFF/, '');
    
    // Log the first few characters of the file for debugging
    console.log('File content preview:', fileContent.substring(0, 100));
    console.log('File content length:', fileContent.length);
    console.log('First line:', fileContent.split('\n')[0]);

    // If content looks like JSON, return error
    if (fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_FORMAT',
          message: 'File content appears to be JSON instead of CSV. Please upload a valid CSV file.'
        }
      });
    }

    // Split into lines and validate basic structure
    const lines = fileContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CSV',
          message: 'CSV must contain at least a header row and one data row'
        }
      });
    }

    // Validate header row
    const headerRow = lines[0].toLowerCase();
    if (!headerRow.includes('name') || !headerRow.includes('phone')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HEADERS',
          message: 'CSV must contain "name" and "phone" columns'
        }
      });
    }

    // Parse CSV using csv-parse
    const records = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      const parser = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          // Clean and validate each record
          const cleanRecord = {
            name: (record.name || record.Name || '').toString().trim(),
            phone: (record.phone || record.Phone || '').toString().trim(),
            email: (record.email || record.Email || '').toString().trim(),
            notes: (record.notes || record.Notes || '').toString().trim(),
          };

          // Basic validation
          if (!cleanRecord.name || !cleanRecord.phone) {
            continue;
          }

          // Clean phone number
          const phone = cleanRecord.phone.replace(/[^\d+]/g, '');
          if (!/^\+?\d{7,}$/.test(phone)) {
            continue;
          }

          results.push({
            ...cleanRecord,
            phone,
            userId: req.user!.id,
            source: 'CSV_IMPORT',
            version: 1
          });
        }
      });

      parser.on('error', function(err) {
        reject(err);
      });

      parser.on('end', function() {
        resolve(results);
      });
    });

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_VALID_CONTACTS',
          message: 'No valid contacts found in CSV'
        }
      });
    }

    // Save to database
    const result = await prisma.contact.createMany({
      data: records,
      skipDuplicates: true
    });

    return res.json({
      success: true,
      data: {
        imported: result.count
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to process CSV file',
        details: error
      }
    });
  }
});

export default router;