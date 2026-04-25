# Manual Wine Alignment - Step-by-Step

## To diagnose the alignment problem:

### 1. Check what wines exist in database:
```bash
curl -X GET "https://your-app.vercel.app/api/admin/inventory/diagnose" \
  -H "Cookie: your-nextauth-cookie"
```

This shows:
- All companies and their actual slugs/names
- All wine products in database  
- Whether producer companies are found

**Key questions to answer**:
- Do you see companies named: L'Autin, Lantieri, Faccinelli, Randi, Stroppiana, Zanotelli?
- What are their **exact slugs** in the database?
- How many wines per company?

### 2. Analyze why wines aren't matching:
```bash
curl -X POST "https://your-app.vercel.app/api/admin/inventory/match-analysis" \
  -H "Cookie: your-nextauth-cookie" \
  -H "Content-Type: application/json"
```

This shows:
- Which proforma wines found their producer company ❌ or ✅
- Token similarity scores for each candidate wine
- Why each wine passed or failed matching

**Key questions to answer**:
- What percentage are matched? (current: likely very low)
- Which producers aren't found?
  - LAUTIN?
  - LANTIERI?
  - FACCINELLI?
  - RANDI?
  - STROPP?
  - ZANOTELLI?
- Which wines have low similarity scores?

---

## Most Likely Root Causes

### Issue 1: Producer Companies Don't Exist (or Different Names)
If diagnostic shows no companies for a producer, they either:
- Don't exist in database
- Have a completely different name/slug

**Solution**: Create or update company records:

```sql
-- Check existing company slugs:
SELECT name, slug FROM "Company" ORDER BY name;

-- If missing, identify the real company names/slugs
-- Then update proforma producerId values to match, OR
-- Create missing companies with matching slugs
```

### Issue 2: Wine Names Don't Match
Even if companies exist, wine names might not match.

**Example mismatch**:
- Proforma: "El Bertu 2021"
- DB: "El Bertu Rosso 2021" (extra "Rosso")
- Solution: Matching algorithm now handles this! Should work at 60%+ similarity

**But if still failing**:
- Normalize both names and compare tokens
- Check if vintage is stored as separate field vs embedded in name
- Check if format/bottleSizeMl values exist

### Issue 3: Vintage or Format Mismatches
- Proforma vintage: 2021
- DB vintage: null (not stored)
- Solution: New algorithm allows "vintage flexible" tier matching

---

## If Manual Fix Needed

### Option A: Fix Company Slugs
If companies exist but slugs don't match producer IDs:

```typescript
// In Prisma Studio or database:
UPDATE "Company" 
SET slug = 'l-autin' OR slug = 'lautin'  
WHERE name LIKE '%L%Autin%'
```

Then test match-analysis again.

### Option B: Fix Wine Product Data
If wine names don't contain key tokens:

```typescript
// In Prisma Studio:
// Set missing fields:
- bottleSizeMl: 750 (if null)
- vintage: 2021 (if missing but in name)
- format: 'bottle' or 'can'
- costEUR: from proforma
```

### Option C: Create Production Mapping
If companies/wines don't match database structure:

Create a mapping file that explicitly tells the sync which DB wine is which proforma wine:

```typescript
// Example mapping: [proformaIndex] → [dbProductId]
const wineMapping = {
  0: 'product-id-for-el-bertu',  // LAUTIN - El Bertu 2021
  1: 'product-id-for-gemma-vitis',  // LAUTIN - Gemma Vitis 2025
  // ... all 27 wines
}
```

---

## Once Root Cause Identified

### Run Sync to Align:
```bash
curl -X POST "https://your-app.vercel.app/api/admin/inventory/sync-proforma" \
  -H "Cookie: your-nextauth-cookie" \
  -H "Content-Type: application/json"
```

**Result shows**:
```json
{
  "success": true,
  "summary": {
    "updated": 27,  // Ideally should be 27
    "unmatched": 0,
    "errors": 0
  },
  "details": {
    "updated": [
      {
        "productId": "...",
        "name": "El Bertu 2021",
        "sku": "TT-LAUTIN-ELBERTU-2021-750",
        "newInventory": 480,
        "newCostEUR": 8.00,
        "newPrice": 24.50
      }
    ]
  }
}
```

### Verify in Admin:
1. Go to admin inventory panel
2. Filter by producer
3. Verify all 27 wines show correct:
   - ✅ SKU (format: TT-{PRODUCER}-{WINE}-{VINTAGE}-{FORMAT})
   - ✅ Inventory (from proforma quantities)
   - ✅ Cost (EUR values)
   - ✅ Retail Price (auto-calculated)

---

## Expected Final State

After successful alignment:

**L'Autin** (5 wines):
- El Bertu 2021: 480 units, €8.00
- Gemma Vitis (Bonarda) 2025: 960 units, €5.60
- Re Nero (Pinot Nero) 2022: 360 units, €8.50
- Le Ramie 2024: 180 units, €12.00
- Musca Bianca 2023: 720 units, €5.60

**Lantieri** (3 wines):
- Franciacorta Brut: 960 units, €12.50
- Franciacorta Satèn: 480 units, €14.20
- Franciacorta Rosé: 480 units, €14.20

[... similar for other 4 producers ...]

**Total**: 27 wines ✅
