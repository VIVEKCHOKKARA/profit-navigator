import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtfbniuhddwnorelexoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0ZmJuaXVoZGR3bm9yZWxleG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDMzODMsImV4cCI6MjA4OTcxOTM4M30.OSLYAQHlexG0j-_uusQt3-zJ556GiSzJfewLz7mFX0M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding products...');
  const { data: pData, error: pError } = await supabase.from('products').insert([
    {
      name: 'Dynamic Ultra Smart Watch',
      category: 'Electronics',
      price: 199.99,
      units_sold: 1250,
      revenue: 249987,
      trend: 'up',
      cluster: 'star'
    },
    {
      name: 'Eco-Friendly Bamboo Speaker',
      category: 'Electronics',
      price: 45.00,
      units_sold: 80,
      revenue: 3600,
      trend: 'down',
      cluster: 'underperformer'
    }
  ]);
  if (pError) console.error('E:', pError);
  else console.log('Products seeded!');

  console.log('Seeding transactions...');
  const { data: tData, error: tError } = await supabase.from('transactions').insert([
    { date: '2026-03-24', description: 'Bulk Sale - Smart Watch', category: 'Sales', amount: 4500, type: 'income' },
    { date: '2026-03-24', description: 'Logistics Costs', category: 'Operations', amount: 1200, type: 'expense' },
    { date: '2026-03-25', description: 'Online Store Sales', category: 'Sales', amount: 3200, type: 'income' },
    { date: '2026-03-26', description: 'Office Rent', category: 'Overhead', amount: 2500, type: 'expense' },
    { date: '2026-03-27', description: 'Warehouse Order - Electronics', category: 'Inventory', amount: 8000, type: 'expense' },
    { date: '2026-03-27', description: 'Direct Sales - Bamboo Speaker', category: 'Sales', amount: 1500, type: 'income' }
  ]);
  if (tError) console.error('E:', tError);
  else console.log('Transactions seeded!');
}

seed();
