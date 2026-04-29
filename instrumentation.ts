export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { Pool } = await import("pg");

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL is not set — skipping migration");
      return;
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS shifts (
          id SERIAL PRIMARY KEY,
          day VARCHAR(20) NOT NULL,
          slot VARCHAR(50) NOT NULL,
          zone VARCHAR(100) NOT NULL,
          hours NUMERIC(4,2) NOT NULL,
          gross_earnings NUMERIC(8,2) NOT NULL,
          tip_total NUMERIC(8,2) DEFAULT 0,
          miles_driven NUMERIC(8,2) DEFAULT 0,
          order_count INTEGER DEFAULT 0,
          gas_cost NUMERIC(6,2) DEFAULT 0,
          net_earnings NUMERIC(8,2) GENERATED ALWAYS AS (gross_earnings - gas_cost) STORED,
          weather_condition VARCHAR(50),
          local_event VARCHAR(200),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS zones (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          lat NUMERIC(10,7) NOT NULL,
          lng NUMERIC(10,7) NOT NULL,
          cluster_score INTEGER DEFAULT 0
        );
      `);

      await client.query(`
        INSERT INTO zones (name, lat, lng) VALUES
          ('Thousand Oaks', 34.1706, -118.8376),
          ('Simi Valley', 34.2694, -118.7815),
          ('Moorpark', 34.2856, -118.8820),
          ('Westlake Village', 34.1453, -118.8192),
          ('Camarillo', 34.2164, -119.0376),
          ('Agoura Hills', 34.1531, -118.7617)
        ON CONFLICT DO NOTHING;
      `);

      console.log("✅ Migration complete. Tables ready.");
    } catch (err) {
      console.error("❌ Migration failed:", err);
    } finally {
      client.release();
      await pool.end();
    }
  }
}
