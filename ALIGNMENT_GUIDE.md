# Phase 27A: Wine Inventory Alignment - Manual Guide

## Problem
The proforma wines are not aligning with database wines. This guide provides diagnostic steps and manual alignment procedures.

## Diagnostic Endpoints Created

### 1. Database Inventory Diagnostic
**GET** `/api/admin/inventory/diagnose`

Shows:
- All companies in the database with their slugs and names
- All wine products grouped by company
- Total wine count per company

**Use Case**: Understand what companies and wines exist in the database

**Example Response Structure**:
```json
{
  "summary": {
    "totalCompanies": N,
    "totalWines": M,
    "companiesWithWines": K
  },
  "companies": [
    { "id": "...", "name": "...", "slug": "...", "productCount": N, "wineCount": M }
  ],
  "winesByCompany": {
    "L'Autin": [...26 wine products...]
  }
}
```

### 2. Match Analysis Endpoint
**POST** `/api/admin/inventory/match-analysis`

Shows:
- Detailed matching attempts for each of the 27 proforma wines
- Which companies are found (or not found) for each producer
- Similarity scores for candidate wines
- Tier classification for each potential match

**Use Case**: Understand exactly why wines are or aren't being matched

**Example Response Structure**:
```json
{
  "summary": {
    "totalProforma": 27,
    "matched": X,
    "unmatched": Y,
    "matchPercentage": Z
  },
  "analyses": [
    {
      "proformaEntry": { "producerId": "LAUTIN", "name": "El Bertu 2021", ... },
      "producerMatchFound": true/false,
      "companiesFound": [...],
      "candidateWines": [
        { 
          "name": "...", 
          "tokenSimilarity": 0.75, 
          "vintageMatch": true/false, 
          "formatMatch": true/false,
          "overallMatch": true/false 
        }
      ],
      "matchResult": { "matched": true/false, "product": {...} }
    }
  ]
}
```

## Workflow to Fix Alignment

### Step 1: Run Diagnostic
Call **GET** `/api/admin/inventory/diagnose` to understand database structure

**Look for**:
- Are the 6 producer companies (L'Autin, Lantieri, Faccinelli, Randi, Stroppiana, Zanotelli) in the database?
- What are their exact slugs and names?
- How many wine products does each company have?

### Step 2: Run Match Analysis
Call **POST** `/api/admin/inventory/match-analysis` to see matching details

**Look for**:
- Which producers are NOT found by company lookup?
- Which wines have low token similarity?
- Are vintage or format mismatches preventing alignment?

### Step 3: Fix Company Lookup (if needed)
If producers aren't being found:

**Option A**: Update company slug/name to match producer ID
- L'Autin company slug should contain "lautin" or name contains "L'Autin"
- Lantieri - contains "lantieri"
- Faccinelli - contains "faccinelli"
- Randi - contains "randi"
- Stroppiana - slug/name contains "stropp"
- Zanotelli - contains "zanotelli"

**Option B**: Update proforma producer IDs to match company names/slugs exactly

### Step 4: Check Wine Data Quality
For wines that match producers but don't align:

**Check**:
- Do wine names contain key identifying tokens? (e.g., "Barolo", "Bonarda", "Franciacorta")
- Are `bottleSizeMl` values set correctly in database?
- Are `vintage` values correct? (should be 4-digit year or null)

### Step 5: Run Sync
Once diagnostic shows good matches:

**POST** `/api/admin/inventory/sync-proforma`

This will:
1. Match each of 27 proforma wines to database products
2. Assign SKUs (format: TT-{PRODUCER}-{WINE}-{VINTAGE}-{FORMAT})
3. Update inventory quantities
4. Update costEUR values
5. Recalculate retail prices via pricing engine
6. Return summary of matched/unmatched wines

## Matching Algorithm (4-Tier System)

**Tier 1** (Best):  
Name similarity ≥ 60% + exact format + exact/null vintage  
Example: "Barolo Leonardo" existing → matches "Barolo Leonardo" proforma

**Tier 2**:  
Name similarity ≥ 55% + exact format + vintage flexible  
Example: "Barolo 2019" existing → matches "Barolo" proforma (null vintage)

**Tier 3**:  
Name similarity ≥ 50% + format flexible (±50ml) + exact/null vintage  
Example: "Spritz 250ml" existing → matches "Spritz 250ml" proforma

**Tier 4** (Fallback):  
Name similarity ≥ 50% only  
Example: "Skin Contact White Wine" → matches "Skin Contact White" if no better match

## Troubleshooting

### No wines matching
- Check if companies exist with correct producer slugs
- Verify wine names contain key tokens (artist, region, style)
- Check if bottleSizeMl values populate

### Some wines unmatched
- Run Match Analysis to see which ones and why
- Manually verify if those wines actually exist in database
- Check name normalization (accents removed, DOC/DOCG removed)

### All matched but inventory wrong
- Check quantity values after sync
- Verify costEUR is being applied correctly
- Check if pricing engine is working (buildWinePricing function)

## Next Steps

1. **IMMEDIATE**: Call `/api/admin/inventory/diagnose` to see database state
2. **ANALYZE**: Call `/api/admin/inventory/match-analysis` to see matching details
3. **FIX**: Based on analysis, either:
   - Update company data to match proforma IDs
   - Update wine product data to match proforma expectations
   - Adjust matching thresholds if business logic requires
4. **SYNC**: Call `/api/admin/inventory/sync-proforma` to apply changes
5. **VERIFY**: Check admin panel to confirm 27 wines are aligned with correct inventory/pricing
