import { pool, initDatabase } from '../src/config/db.js';

const PRODUCTS = [
  // Page 2: FLASH LIGHT CRACKERS
  { name: '4" LAKSHMI', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 80.00 },
  { name: '3 1/2" LAKSHMI', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 60.00 },
  { name: '2 3/4" KURUVI', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 40.00 },
  { name: '4" DELUXE LAKSHMI', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 150.00 },
  { name: '4" GOLD LAKSHMI', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 165.00 },
  { name: '5" WARRIORS', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 200.00 },
  { name: '5" SUPER FIGHTERS', category: 'FLASH LIGHT CRACKERS', unit: 'PKT', rate: 300.00 },

  // Page 2: FLOWER POTS
  { name: 'FLOWER POT BIG (10PCS)', category: 'FLOWER POTS', unit: 'BOX', rate: 300.00 },
  { name: 'FLOWER POTS SPECIAL (10 PCS)', category: 'FLOWER POTS', unit: 'BOX', rate: 400.00 },
  { name: 'FLOWER POTS ASHOKA (10 PCS)', category: 'FLOWER POTS', unit: 'BOX', rate: 550.00 },
  { name: 'FLOWER POTS COLOR KOTI (10 PCS)', category: 'FLOWER POTS', unit: 'BOX', rate: 925.00 },
  { name: 'FLOWER POTS TRI COLOR (5 PCS)', category: 'FLOWER POTS', unit: 'PKT', rate: 1250.00 },

  // Page 2: GROUND CHAKKAR
  { name: 'GROUND CHAKKAR BIG', category: 'GROUND CHAKKAR', unit: 'BOX', rate: 175.00 },
  { name: 'GROUND CHAKKAR SPECIAL', category: 'GROUND CHAKKAR', unit: 'BOX', rate: 400.00 },
  { name: 'GROUND CHAKKAR DELUXE', category: 'GROUND CHAKKAR', unit: 'BOX', rate: 600.00 },

  // Page 2: SPINNER WHEELS
  { name: 'SIREN WHEEL', category: 'SPINNER WHEELS', unit: 'BOX', rate: 500.00 },
  { name: 'SPINNER SPECIAL WHEEL', category: 'SPINNER WHEELS', unit: 'BOX', rate: 600.00 },
  { name: 'SPINNER DELUXE WHEEL', category: 'SPINNER WHEELS', unit: 'BOX', rate: 800.00 },
  { name: 'WIRED CHAKKAR', category: 'SPINNER WHEELS', unit: 'BOX', rate: 1100.00 },
  { name: 'WIZZ CHAKKAR', category: 'SPINNER WHEELS', unit: 'BOX', rate: 600.00 },
  { name: '4X4 WHEEL', category: 'SPINNER WHEELS', unit: 'BOX', rate: 750.00 },

  // Page 2: TWINKLING STAR & PENCIL
  { name: '1 1/2 TWINKLING STAR', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 110.00 },
  { name: '4" TWINKLING STAR', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 300.00 },
  { name: 'SELFIE STICK', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 225.00 },
  { name: 'JELLY BEEN CANDLE (3Pcs)', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 500.00 },
  { name: 'PENCIL WATER FALLS', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 1000.00 },
  { name: 'HI - TECH COLOUR CANDELS (3 PCS)', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 800.00 },
  { name: 'WONDERLA WHT CRACKLING CANDELS (3 PCS)', category: 'TWINKLING STAR & PENCIL', unit: 'BOX', rate: 800.00 },

  // Page 2: BOMBS
  { name: 'HYDRO BULLET', category: 'BOMBS', unit: 'BOX', rate: 260.00 },
  { name: 'CLASSIC BOMB', category: 'BOMBS', unit: 'BOX', rate: 650.00 },
  { name: 'DIGITAL BOMB', category: 'BOMBS', unit: 'BOX', rate: 1100.00 },

  // Page 3: FANCY ROCKETS
  { name: 'ROCKET BOMB', category: 'FANCY ROCKETS', unit: 'BOX', rate: 400.00 },
  { name: 'MUSICAL ROCKET', category: 'FANCY ROCKETS', unit: 'BOX', rate: 700.00 },

  // Page 3: ELECTRIC CRACKERS
  { name: '28 ELECTRIC', category: 'ELECTRIC CRACKERS', unit: 'PKT', rate: 750.00 },
  { name: 'RED BIJILI (100 Pcs)', category: 'ELECTRIC CRACKERS', unit: 'PKT', rate: 175.00 },
  { name: 'STRIPPED BIJILI (100 Pcs)', category: 'ELECTRIC CRACKERS', unit: 'PKT', rate: 190.00 },

  // Page 3: SUPER POWER
  { name: '1K SUPER POWER', category: 'SUPER POWER', unit: 'BOX', rate: 1000.00 },
  { name: '2 K SUPER POWER', category: 'SUPER POWER', unit: 'BOX', rate: 2000.00 },
  { name: '5K SUPER POWER', category: 'SUPER POWER', unit: 'BOX', rate: 5000.00 },
  { name: '10 K SUPER POWER', category: 'SUPER POWER', unit: 'BOX', rate: 10000.00 },

  // Page 3: KIDS SPECIAL (FANCY NOVELTIES)
  { name: 'ELETRIC STONE', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 50.00 },
  { name: 'MAGIC POP', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 50.00 },
  { name: 'PARASUIT', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 300.00 },
  { name: 'HELICOPTER/DRONE', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 500.00 },
  { name: 'DANCING BUTTERFLY', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 400.00 },
  { name: 'PHOTO FLASH', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 350.00 },
  { name: 'BAMBARAM (RED & GREEN)', category: 'KIDS SPECIAL (FANCY NOVELTIES)', unit: 'BOX', rate: 600.00 },

  // Page 3 & 4: FANCY NOVELTIES
  { name: 'TWEET', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 750.00 },
  { name: 'POPING', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 750.00 },
  { name: '6000', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 750.00 },
  { name: 'ANGRY BIRDS', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 400.00 },
  { name: 'MONEY IN THE BANK', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 275.00 },
  { name: 'GOLDEN DROPS ( 5IN 1)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 550.00 },
  { name: 'SLIVER DROPS ( 5 IN 1)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 550.00 },
  { name: 'PEACOCK FEATHER (5 IN 1)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 550.00 },
  { name: 'POGO', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 200.00 },
  { name: 'APPU FOUNTATION (DOUBLE STEP)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 850.00 },
  { name: 'STAR DRUM (FULL CRACKLING)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 800.00 },
  { name: 'CHOCONS (2 PCS)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 1000.00 },
  { name: 'BLOCK FOREST (2 PCS)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 1000.00 },
  { name: 'BLOSSOM (PINK ATTRACTION)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 900.00 },
  { name: 'BUTTERCUP (WHITE SHOWER)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 900.00 },
  { name: 'BUBBLES (GREEN SHOWER)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 900.00 },
  { name: 'LEMON TREE (2 STEP)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 850.00 },
  { name: 'ORION FOUNTAIN ( FULL CRACKLING)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 900.00 },
  { name: 'FRUIT SERIAS', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 800.00 },
  { name: 'SHINCHAN ( 5 in 1)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 700.00 },
  { name: 'FANTASTY LION', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 950.00 },
  { name: 'FANTASTY ELEPHANT', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 950.00 },
  { name: 'TOP GUN+27 (5PCS)', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 500.00 },
  { name: 'MULTICOLOUR SMOKE', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 650.00 },
  { name: 'LOLLIPOP', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 800.00 },
  { name: 'POWER POT / BLUE ICE', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 650.00 },
  { name: 'CHICKEN HOT / GREEN MILE', category: 'FANCY NOVELTIES', unit: 'BOX', rate: 650.00 },

  // Page 4: CRACKLING TIN SERIES (Unit: TIN)
  { name: 'ENERGY FOUNTAIN', category: 'CRACKLING TIN SERIES', unit: 'TIN', rate: 500.00 },
  { name: '4.5" MULTI COLOUR FOUNTAIN', category: 'CRACKLING TIN SERIES', unit: 'TIN', rate: 700.00 },
  { name: '6" MULTI COLOUR FOUNTAIN', category: 'CRACKLING TIN SERIES', unit: 'TIN', rate: 850.00 },
  { name: '6" WATER QUEEN', category: 'CRACKLING TIN SERIES', unit: 'TIN', rate: 850.00 },

  // Page 4: PEACOCK (MULTI COLOUR)
  { name: 'BADA PEACOCK', category: 'PEACOCK (MULTI COLOUR)', unit: 'BOX', rate: 2000.00 },
  { name: 'MAGICAL PEACOCK', category: 'PEACOCK (MULTI COLOUR)', unit: 'BOX', rate: 800.00 },

  // Page 4: FANCY PIPE
  { name: '2"FANCY SINGLE (4 VARIETIES) / SINGLE PIPE', category: 'FANCY PIPE', unit: 'BOX', rate: 450.00 },
  { name: '2" FANCY(3PCS)/ (3 VARIETIES)', category: 'FANCY PIPE', unit: 'BOX', rate: 1250.00 },
  { name: '3 1/2 FANCY (SINGLE PCS)/ (6 VARIETIES)', category: 'FANCY PIPE', unit: 'BOX', rate: 1250.00 },

  // Page 4: 4FANCY PIPE
  { name: 'THAI AIRWAYS', category: '4FANCY PIPE', unit: 'BOX', rate: 1900.00 },
  { name: 'FLY EMIRATES', category: '4FANCY PIPE', unit: 'BOX', rate: 1900.00 },
  { name: 'BRITISH AIRWAYS', category: '4FANCY PIPE', unit: 'BOX', rate: 1900.00 },
  { name: 'JET AIRWAYS', category: '4FANCY PIPE', unit: 'BOX', rate: 1900.00 },
  { name: 'INDICO', category: '4FANCY PIPE', unit: 'BOX', rate: 1900.00 },
  { name: 'SONY/SAMSUNG/NIKON (2 Pcs)', category: '4FANCY PIPE', unit: 'BOX', rate: 3500.00 },
  { name: 'AMERICAN FANCY (2 PCS)', category: '4FANCY PIPE', unit: 'BOX', rate: 3500.00 },

  // Page 4: SPL FANCY PIPE
  { name: 'NAYAGARA', category: 'SPL FANCY PIPE', unit: 'BOX', rate: 1550.00 },
  { name: 'DIGITAL STAR', category: 'SPL FANCY PIPE', unit: 'BOX', rate: 1550.00 },
  { name: 'ORANGE FANCY', category: 'SPL FANCY PIPE', unit: 'BOX', rate: 2500.00 },
  { name: 'PURPLE FANCY', category: 'SPL FANCY PIPE', unit: 'BOX', rate: 2500.00 },
  { name: 'LEMON FANCY', category: 'SPL FANCY PIPE', unit: 'BOX', rate: 2500.00 },
  { name: 'PINK FANCY', category: 'SPL FANCY PIPE', unit: 'BOX', rate: 2500.00 },

  // Page 5: 5 FANCY (DOUBLE PCS)
  { name: '5" MAGIC STAR', category: '5 FANCY (DOUBLE PCS)', unit: 'BOX', rate: 3250.00 },
  { name: '5" NAYAGARA FALLS', category: '5 FANCY (DOUBLE PCS)', unit: 'BOX', rate: 3250.00 },

  // Page 5: MULTI COLOUR FUNCTIONS
  { name: '7SHOTS', category: 'MULTI COLOUR FUNCTIONS', unit: 'BOX', rate: 400.00 },
  { name: 'SKY SHOTS', category: 'MULTI COLOUR FUNCTIONS', unit: 'BOX', rate: 350.00 },
  { name: 'PENTAGAN (5in1 Multi Colour)', category: 'MULTI COLOUR FUNCTIONS', unit: 'BOX', rate: 1050.00 },

  // Page 5: REPEATING SHORT RIDER
  { name: '12 SHOTS RIDER', category: 'REPEATING SHORT RIDER', unit: 'BOX', rate: 675.00 },
  { name: '25 SHOTS RAIDER', category: 'REPEATING SHORT RIDER', unit: 'BOX', rate: 1200.00 },

  // Page 5: REPEATING MULTI COLOUR SHOTS
  { name: '30 MULTI COLOUR SHOTS', category: 'REPEATING MULTI COLOUR SHOTS', unit: 'BOX', rate: 1800.00 },
  { name: '60 MULTI COLOUR SHOTS', category: 'REPEATING MULTI COLOUR SHOTS', unit: 'BOX', rate: 3600.00 },
  { name: '30 MULTI COLOUR SHOTS (DIAMOND)', category: 'REPEATING MULTI COLOUR SHOTS', unit: 'BOX', rate: 2150.00 },
  { name: '60 MULTI COLOUR SHOTS (DIAMOND)', category: 'REPEATING MULTI COLOUR SHOTS', unit: 'BOX', rate: 4300.00 },
  { name: '120 MULTI COLOUR SHOTS', category: 'REPEATING MULTI COLOUR SHOTS', unit: 'BOX', rate: 8800.00 },
  { name: '200 MULTI COLOUR SHOTS', category: 'REPEATING MULTI COLOUR SHOTS', unit: 'BOX', rate: 15500.00 },

  // Page 5: PAPER BOMB
  { name: '1/4 PAPER BOMB', category: 'PAPER BOMB', unit: 'BOX', rate: 250.00 },
  { name: '1/2 PAPER BOMB', category: 'PAPER BOMB', unit: 'BOX', rate: 500.00 },
  { name: '1 Kg PAPER BOMB', category: 'PAPER BOMB', unit: 'BOX', rate: 1000.00 },

  // Page 5: SET OUT MEGA SERIES
  { name: 'BHARATHA RATHNA (2 1/2 PIPE)', category: 'SET OUT MEGA SERIES', unit: 'BOX', rate: 16000.00 },
  { name: 'UNIVERCEL 23/4 COMMENTO', category: 'SET OUT MEGA SERIES', unit: 'BOX', rate: 20000.00 },

  // Page 5: COLOUR MATCHES
  { name: '3 IN 1 MATCHES', category: 'COLOUR MATCHES', unit: 'BOX', rate: 100.00 },
  { name: 'POKEMON MATCHES (10 IN 1)', category: 'COLOUR MATCHES', unit: 'BOX', rate: 1000.00 },

  // Page 5: KIDS SPECIAL
  { name: 'SERPENT EGG BIG', category: 'KIDS SPECIAL', unit: 'BOX', rate: 100.00 },

  // Page 5 & 6: SPARKLERS
  { name: '7 CM ELECTRIC SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 55.00 },
  { name: '7CM COLOUR SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 65.00 },
  { name: '10 CM ELECTRIC SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 105.00 },
  { name: '10 CM COLOUR SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 115.00 },
  { name: '10 CM GREEN SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 130.00 },
  { name: '10 CM RED SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 140.00 },
  { name: '15 CM ELETRIC SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 195.00 },
  { name: '15 CM COLOUR SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 205.00 },
  { name: '15 CM GREEN SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 225.00 },
  { name: '15 CM RED SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 245.00 },
  { name: '30 CM ELETRIC SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 195.00 },
  { name: '30 CM COLOR SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 205.00 },
  { name: '30 CM GREEN SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 225.00 },
  { name: '30 CM RED SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 245.00 },
  { name: '50 CM ELECTRIC SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 700.00 },
  { name: '50 CM COLOR SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 800.00 },
  { name: 'ROUTATING SPARKLERS', category: 'SPARKLERS', unit: 'BOX', rate: 1000.00 },

  // Page 6: GIFT BOXES
  { name: '21 ITEMS', category: 'GIFT BOXES', unit: 'BOX', rate: 250.00 },
  { name: '31 ITEMS', category: 'GIFT BOXES', unit: 'BOX', rate: 410.00 },
  { name: '41 ITEMS', category: 'GIFT BOXES', unit: 'BOX', rate: 510.00 },
];

async function seed() {
  console.log(`\n======================================================`);
  console.log(`Starting AVS 2026 Price List Seeding...`);
  console.log(`Total Products to process: ${PRODUCTS.length}`);
  console.log(`======================================================\n`);

  try {
    // 1. Ensure DB & tables exist
    await initDatabase();

    // 2. Extract unique categories
    const categoriesSet = new Set(PRODUCTS.map((p) => p.category));
    const categoriesList = Array.from(categoriesSet);
    console.log(`Found ${categoriesList.length} unique categories.`);

    // 3. Ensure categories are present in `categories` table
    for (const catName of categoriesList) {
      const [existing] = await pool.query(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
        [catName.trim()]
      );

      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO categories (name, description, is_active) VALUES (?, ?, ?)',
          [catName.trim(), `${catName} Cracker Section`, 1]
        );
        console.log(`[Category Created] ${catName}`);
      }
    }

    // 4. Insert or update products
    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of PRODUCTS) {
      const [existing] = await pool.query(
        'SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1',
        [item.name.trim()]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO products 
            (name, category, brand, hsn_code, unit, selling_price, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.name.trim(),
            item.category.trim(),
            'AVS CRACKERS',
            null, // HSN code left empty/null as requested
            item.unit,
            item.rate,
            1,
          ]
        );
        insertedCount++;
      } else {
        await pool.query(
          `UPDATE products 
           SET category = ?, brand = ?, hsn_code = ?, unit = ?, selling_price = ?, is_active = ? 
           WHERE id = ?`,
          [
            item.category.trim(),
            'AVS CRACKERS',
            null,
            item.unit,
            item.rate,
            1,
            existing[0].id,
          ]
        );
        updatedCount++;
      }
    }

    console.log(`\n======================================================`);
    console.log(`Seeding Completed Successfully!`);
    console.log(`New Products Inserted: ${insertedCount}`);
    console.log(`Existing Products Updated: ${updatedCount}`);
    console.log(`Total Products in Catalog: ${PRODUCTS.length}`);
    console.log(`======================================================\n`);

    process.exit(0);
  } catch (err) {
    console.error('[Seeding Error]', err);
    process.exit(1);
  }
}

seed();

