# Airtable to Supabase Import Guide

## 📋 Pre-Import Checklist

### 1. Run Migration First
Before importing data, run the `complete-framework-migration.sql` file in your Supabase SQL Editor.

### 2. Identify Your Airtable Tables
Common tables you might have:
- **Freedom Score Assessments** → Maps to `freedom_score_components`
- **Business Frameworks** → Maps to `sprints` and `strategic_guidance`
- **Client Data** → Maps to `business_context` 
- **Content Templates** → Maps to `content_library`
- **User Progress** → Maps to `user_sprint_assignments`

## 🔧 Method 1: CSV Export/Import

### Export from Airtable:
1. Open your Airtable base
2. For each table:
   - Click the table name
   - Click "Views" dropdown
   - Select "Download CSV"
   - Save with descriptive name (e.g., `frameworks-export.csv`)

### Import to Supabase:
1. Go to Supabase Dashboard → Table Editor
2. Select target table
3. Click "Insert" → "Import data from CSV" 
4. Upload CSV file
5. Map columns carefully
6. Review and import

## 📊 Data Mapping Guide

### Frameworks Data → `sprints` table:
- Airtable "Sprint Name" → `name`
- Airtable "Full Title" → `full_title`
- Airtable "Description" → `description`
- Airtable "Methodology" → `methodology`
- Airtable "Sprint Key" → `sprint_key` (S1, S2, etc.)

### Strategic Guidance → `strategic_guidance` table:
- Airtable "Title" → `title`
- Airtable "Content" → `content`
- Airtable "Category" → `category`
- Airtable "Type" → `guidance_type`
- Airtable "Tags" → `context_tags` (as JSON array)

### Client/Business Data → `business_context` table:
- Airtable "Business Name" → `business_name`
- Airtable "Industry" → `business_type`
- Airtable "Stage" → `business_stage`
- Airtable "Challenges" → `primary_challenges`

## ⚠️ Common Issues & Solutions

### Issue: Column Mismatch
**Problem**: Airtable columns don't match Supabase columns
**Solution**: 
1. Add missing columns to Supabase table, OR
2. Edit CSV headers to match Supabase columns

### Issue: Data Format Problems
**Problem**: Arrays, JSON data not importing correctly
**Solution**: Format as JSON arrays in CSV:
- `["tag1", "tag2", "tag3"]` for arrays
- `{"key": "value"}` for JSON objects

### Issue: Foreign Key Relationships
**Problem**: Related records don't link properly
**Solution**: Import in order:
1. Parent tables first (sprints, framework_modules)
2. Child tables second (strategic_guidance, user_assignments)

## 🚀 Need Help?

If you run into issues:
1. **Share your table structure**: Tell me what tables you have
2. **Export sample data**: Send me a few rows so I can see the format
3. **I'll create custom import scripts** for complex data

## 📝 Data Validation Checklist

After import, verify:
- [ ] All records imported (count matches)
- [ ] Relationships work (foreign keys link correctly)
- [ ] JSON/Array fields display properly
- [ ] No duplicate records
- [ ] Test AI strategist still works with new data