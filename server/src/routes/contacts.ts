import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | any>;

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

// Type guard to check if user exists and has required properties
function isAuthenticated(req: Request): req is Request & { user: AuthUser } {
  return req.user !== undefined && 
         typeof req.user.id === 'string' && 
         typeof req.user.email === 'string' && 
         typeof req.user.role === 'string';
}

// Get all contacts for a user
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      include: {
        goals: true
      }
    });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

// Create a new contact
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { 
      name, 
      email, 
      phone 
    } = req.body;

    const contactData: Prisma.ContactCreateInput = {
      name,
      email,
      user: { connect: { id: req.user.id } }
    };

    const contact = await prisma.contact.create({
      data: contactData
    });

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

// Get a specific contact
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({
      where: { 
        id: id,
        userId: req.user.id 
      },
      include: {
        goals: true
      }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// Update a contact
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      phone 
    } = req.body;

    const contactData: Prisma.ContactUpdateInput = {
      name,
      email
    };

    const contact = await prisma.contact.update({
      where: { 
        id: id,
        userId: req.user.id 
      },
      data: contactData
    });

    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// Delete a contact
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { id } = req.params;

    await prisma.contact.delete({
      where: { 
        id: id,
        userId: req.user.id 
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Upload CSV contacts
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'CSV file is required',
        },
      });
    }

    const fileBuffer = req.file.buffer;
    const stream = Readable.from(fileBuffer.toString());
    const records: any[] = [];

    // Parse CSV using promise
    await new Promise((resolve, reject) => {
      stream
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }))
        .on('data', (record) => records.push(record))
        .on('error', reject)
        .on('end', resolve);
    });

    const contacts: any[] = [];
    const errors: any[] = [];
    
    records.forEach((record, index) => {
      // Validate required fields
      if (!record.name || !record.phone) {
        errors.push({
          row: index + 2, // Add 2 to account for header row and 0-based index
          message: 'Name and phone are required fields',
          data: record,
        });
        return;
      }

      // Basic phone number validation
      const phoneRegex = /^\+?[\d\s-()]+$/;
      if (!phoneRegex.test(record.phone)) {
        errors.push({
          row: index + 2,
          message: 'Invalid phone number format',
          data: record,
        });
        return;
      }

      contacts.push({
        name: record.name,
        phone: record.phone,
        email: record.email || null,
        notes: record.notes || null,
        userId: req.user.id,
        source: 'CSV_IMPORT',
        version: 1,
        originalData: JSON.stringify(record), // Store original data for versioning
      });
    });

    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_VALID_CONTACTS',
          message: 'No valid contacts found in CSV',
          details: errors,
        },
      });
    }

    // Create contacts in bulk
    const createdContacts = await prisma.contact.createMany({
      data: contacts,
      skipDuplicates: true, // Skip duplicates based on unique constraints
    });

    res.status(201).json({
      success: true,
      data: {
        imported: createdContacts.count,
        total: contacts.length,
        errors: errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Download CSV template
router.get('/template', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const template = 'name,phone,email,notes\nJohn Doe,+1234567890,john@example.com,Sample notes';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.csv');
    res.send(template);
  } catch (error) {
    next(error);
  }
});

export default router;
