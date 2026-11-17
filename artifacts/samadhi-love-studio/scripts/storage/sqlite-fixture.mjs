// D1-shaped SQLite adapter for offline tests and an explicitly selected local
// emulated database. Never reads environment credentials or chooses a live DB.
import { DatabaseSync } from "node:sqlite";
export function sqliteD1(filename=":memory:") {
  const sql=new DatabaseSync(filename);
  function prepare(query,params=[]){
    return {bind:(...values)=>prepare(query,values),
      async all(){return {results:sql.prepare(query).all(...params)};},
      async first(column){const row=sql.prepare(query).get(...params);return row?(column?row[column]:row):null;},
      async run(){return {meta:{changes:Number(sql.prepare(query).run(...params).changes)}};},
      execute(){const s=sql.prepare(query);return s.columns().length?{results:s.all(...params)}:{meta:{changes:Number(s.run(...params).changes)}};}
    };
  }
  return {sql,prepare,async batch(statements){
    sql.exec("BEGIN IMMEDIATE");
    try{const results=statements.map(statement=>statement.execute());sql.exec("COMMIT");return results;}
    catch(error){sql.exec("ROLLBACK");throw error;}
  }};
}
