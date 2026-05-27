import { cookies } from 'next/headers'
import { DataAccessPanel } from '@/components/dashboard/data/DataAccessPanel'
import { createClient } from '@/lib/supabase/server'
import duckdb from '@duckdb/node-api'
import { DuckDBInstance } from '@duckdb/node-api'
import path from 'path';

export async function DataLoader() {


    const v = duckdb.version()
    const d = duckdb.configurationOptionDescriptions()
    const m = d['access_mode'] ?? "Option not found in this DuckDB version."
    
    const instance = await DuckDBInstance.create('my_duckdb.db');
    const connection = await instance.connect();
    // Construct the absolute path pointing to: your-project-root/public/shard_0.parquet
    const parquetPath = path.join(process.cwd(), 'public', 'shard_0.parquet');
    const input_parquet = `CREATE TABLE IF NOT EXISTS test AS SELECT * FROM '${parquetPath}';`;
    const result = await connection.run(input_parquet) 
    // 2. Run a COUNT query
    const countResult = 
    await connection.run("SELECT COUNT(*) as total FROM test;");
    // 3. Extract the numeric value from the result set
    // .getRowsObj() returns an array of row objects, e.g., [{ total: 15420 }]
    const rows = await countResult.getRows();
    const rco = rows.length
    // Drill straight into the first row, first column
    const totalRows = rows[0][0];

    // Let's target Row Index 5 (the 6th row in the file)
    const rowIndex = 5; 

    // Query specifically for that single row
    const R2 = await connection.run(
        `SELECT * FROM '${parquetPath}' LIMIT 1 OFFSET ${rowIndex};`
    );
    

  return (
    <div>
        <p>Yo! {v}</p>
        <p>Yo!  {m}</p>
        <p>Yo!  {rco}</p>
        <p>Yo!  {String(totalRows)}</p>
    </div>
  )
}