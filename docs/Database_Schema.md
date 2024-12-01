# Database Schema for Talkai247

## Contact Management and Campaign Integration

### Core Tables

#### 1. Contacts
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_shared BOOLEAN DEFAULT false,
    contact_type VARCHAR(50) -- 'personal' or 'campaign'
);
```

#### 2. Campaigns
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 3. Campaign_Contacts
```sql
CREATE TABLE campaign_contacts (
    id UUID PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    contact_id UUID REFERENCES contacts(id),
    call_mode VARCHAR(50), -- 'ai' or 'manual'
    is_shared_to_personal BOOLEAN DEFAULT false,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(campaign_id, contact_id)
);
```

#### 4. Contact_Tags
```sql
CREATE TABLE contact_tags (
    id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id),
    campaign_id UUID REFERENCES campaigns(id),
    tag_name VARCHAR(255),
    created_at TIMESTAMP
);
```

#### 5. Whisper_Goals
```sql
CREATE TABLE whisper_goals (
    id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id),
    campaign_id UUID REFERENCES campaigns(id), -- Optional, for campaign-specific goals
    title VARCHAR(255),
    description TEXT,
    goal_type VARCHAR(50), -- 'business', 'personal', 'both'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 6. Call_Logs
```sql
CREATE TABLE call_logs (
    id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id),
    campaign_id UUID REFERENCES campaigns(id), -- Optional, for campaign calls
    call_type VARCHAR(50), -- 'ai_campaign', 'manual_campaign', 'personal'
    whisper_enabled BOOLEAN,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER,
    notes TEXT
);
```

### Key Relationships and Constraints

1. **Contact Sharing**:
   - Contacts can exist independently or be associated with campaigns
   - Campaign contacts can be shared to personal contacts via `is_shared_to_personal`
   - Original campaign association is maintained through `contact_tags`

2. **Call Modes**:
   - Campaign contacts can be called via AI or manually
   - Manual calls can utilize Whisper features
   - All calls are logged with appropriate type and context

3. **Whisper Integration**:
   - Whisper goals can be set for any contact
   - Goals can be campaign-specific or general
   - Call logs track Whisper usage and effectiveness

### Indexes and Performance Considerations

```sql
-- Optimize contact lookups
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_type ON contacts(contact_type);

-- Optimize campaign contact queries
CREATE INDEX idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX idx_campaign_contacts_mode ON campaign_contacts(call_mode);

-- Optimize tag searches
CREATE INDEX idx_contact_tags_campaign ON contact_tags(campaign_id);
CREATE INDEX idx_contact_tags_contact ON contact_tags(contact_id);

-- Optimize call log queries
CREATE INDEX idx_call_logs_type ON call_logs(call_type);
CREATE INDEX idx_call_logs_campaign ON call_logs(campaign_id);
```

### Usage Examples

1. **Share Campaign Contacts**:
```sql
UPDATE campaign_contacts
SET is_shared_to_personal = true
WHERE campaign_id = ? AND contact_id IN (?);

INSERT INTO contact_tags (contact_id, campaign_id, tag_name)
VALUES (?, ?, 'Summer Sales Campaign');
```

2. **Enable Manual Campaign Calls**:
```sql
UPDATE campaign_contacts
SET call_mode = 'manual'
WHERE campaign_id = ? AND contact_id = ?;
```

3. **Query Shared Contacts**:
```sql
SELECT c.*, ct.tag_name
FROM contacts c
JOIN contact_tags ct ON c.id = ct.contact_id
WHERE c.is_shared = true
AND ct.campaign_id = ?;
```
