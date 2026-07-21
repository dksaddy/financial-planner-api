import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { Client } from "pg";

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  await client.connect();

  console.log("🌱 Seeding database...");

  try {
    await client.query("BEGIN");

    /* ============================
       USER
    ============================ */

    const password = await bcrypt.hash("password123", 10);

    const userResult = await client.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password,
        salary
      )
      VALUES
      ($1,$2,$3,$4)
      RETURNING id;
      `,
      [
        "Test User",
        "test@example.com",
        password,
        8000,
      ]
    );

    const userId = userResult.rows[0].id;

    console.log("✅ User");

    /* ============================
       SAVING PLANS
    ============================ */

    const savingPlans = [
      [
        "Type 1",
        250,
        7,
        12,
        13000,
        52,
        13619.62,
        "completed",
      ],
      [
        "Type 2",
        2500,
        30,
        12,
        30000,
        12,
        31608.01,
        "completed",
      ],
      [
        "Type 3",
        500,
        7,
        6,
        13000,
        26,
        13298.59,
        "completed",
      ],
      [
        "Type 4",
        250,
        7,
        6,
        6500,
        26,
        6649.39,
        "active",
      ],
    ];

    for (const plan of savingPlans) {
      await client.query(
        `
        INSERT INTO saving_plans
        (
          user_id,
          name,
          amount,
          frequency,
          months,
          deposit_amount,
          deposit_frequency,
          withdrawal_amount,
          status
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [userId, ...plan]
      );
    }

    console.log("✅ Saving Plans");

    /* ============================
       EXPENSE TYPES
    ============================ */

    const expenseTypes = [
      {
        name: "Type 1",
        total: 245,
        categories: [
          { name: "Home-Bus", value: 40 },
          { name: "BRTC/Vuija", value: 25 },
          { name: "Fags", value: 50 },
          { name: "Office", value: 50 },
          { name: "Bus+Fags", value: 80 },
        ],
      },
      {
        name: "Type 2",
        total: 195,
        categories: [
          { name: "Home-Bus", value: 40 },
          { name: "BRTC/Vuija", value: 25 },
          { name: "Fags", value: 50 },
          { name: "Bus+Fags", value: 80 },
        ],
      },
      {
        name: "Type 3",
        total: 210,
        categories: [
          { name: "Home-Bus", value: 10 },
          { name: "BRTC/Vuija", value: 20 },
          { name: "Fags", value: 50 },
          { name: "Office", value: 50 },
          { name: "Bus+Fags", value: 80 },
        ],
      },
      {
        name: "Type 4",
        total: 160,
        categories: [
          { name: "Home-Bus", value: 10 },
          { name: "BRTC/Vuija", value: 20 },
          { name: "Fags", value: 50 },
          { name: "Bus+Fags", value: 80 },
        ],
      },
      {
        name: "Type 5",
        total: 300,
        categories: [
          { name: "Home-Bus", value: 170 },
          { name: "Fags", value: 50 },
          { name: "Bus+Fags", value: 80 },
        ],
      },
    ];

    const expenseTypeIds = [];

    for (const expense of expenseTypes) {
      const result = await client.query(
        `
        INSERT INTO expense_types
        (
          user_id,
          name,
          categories,
          total
        )
        VALUES
        ($1,$2,$3,$4)
        RETURNING id;
        `,
        [
          userId,
          expense.name,
          JSON.stringify(expense.categories),
          expense.total,
        ]
      );

      expenseTypeIds.push({
        id: result.rows[0].id,
        total: expense.total,
      });
    }

    console.log("✅ Expense Types");

    /* ============================
       EXPENSE RECORDS
    ============================ */

    const dates = [
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
    ];

    for (let i = 0; i < dates.length; i++) {
      const type = expenseTypeIds[i % expenseTypeIds.length];

      await client.query(
        `
        INSERT INTO expense_records
        (
          user_id,
          expense_type_id,
          date,
          total
        )
        VALUES
        ($1,$2,$3,$4)
        `,
        [
          userId,
          type.id,
          dates[i],
          type.total,
        ]
      );
    }

    console.log("✅ Expense Records");

    /* ============================
       TARGETS
    ============================ */

    const targets = [
      ["Emergency Fund", 50000, "completed"],
      ["Laptop", 80000, "pending"],
      ["Travel Fund", 25000, "pending"],
    ];

    for (const target of targets) {
      await client.query(
        `
        INSERT INTO targets
        (
          user_id,
          name,
          target_amount,
          status
        )
        VALUES
        ($1,$2,$3,$4)
        `,
        [userId, ...target]
      );
    }

    console.log("✅ Targets");

    await client.query("COMMIT");

    console.log("");
    console.log("🎉 Database seeded successfully.");
    console.log("");
    console.log("Login Credentials");
    console.log("-----------------");
    console.log("Email    : test@example.com");
    console.log("Password : password123");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
  } finally {
    await client.end();
  }
}

seed();