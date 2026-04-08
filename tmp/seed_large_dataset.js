import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding transactions...");

    // Clear existing transactions (optional, but good for a clean demo)
    // await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const categories = ["Electronics", "Lifestyle", "Office", "Inventory", "Software", "Operations", "Marketing"];
    const descriptions = [
        "Online Store Sales", "In-Store Sales", "Marketplace Sales", "Corporate Order",
        "Wholesale Electronics", "Shipping Fees", "Cloud Hosting", "Office Supplies",
        "Facebook Ads", "Consulting Fee", "Retail Sale", "Subscription Payment"
    ];

    const transactions = [];
    const now = new Date();

    // Create transactions for the last 180 days
    for (let i = 180; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Generate 1-5 transactions per day
        const count = Math.floor(Math.random() * 5) + 1;
        for (let j = 0; j < count; j++) {
            const type = Math.random() > 0.3 ? "income" : "expense";
            // Gradually increase sales over time to show a growing trend for LR
            const growthFactor = (180 - i) / 180;
            const baseAmount = type === "income" ? 500 : 200;
            const amount = Math.floor(baseAmount + Math.random() * 1000 + (growthFactor * 1500));

            transactions.push({
                date: dateStr,
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                amount: amount,
                type: type
            });
        }
    }

    // Insert in batches of 100
    for (let i = 0; i < transactions.length; i += 100) {
        const batch = transactions.slice(i, i + 100);
        const { error } = await supabase.from('transactions').insert(batch);
        if (error) console.error("Batch insert error:", error);
        else console.log(`Inserted batch ${i / 100 + 1}`);
    }

    console.log("Seeding complete!");
}

seed();
