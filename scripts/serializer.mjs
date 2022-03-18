import avro from 'avsc';
/** A basic logical type to automatically "unwrap" values. */
let BoxT = class BoxTypeClass extends avro.types.LogicalType {
  _fromValue(val) { return val.unboxed; }
  _toValue(any) { return { unboxed: any }; }
}

export const indexSerializer = avro.Type.forSchema(
  {
    "type": "record", "fields": [
      { "name": "version", "type": "string" },
      { "name": "fields", "type": { "type": "array", "items": "string" } },
      { "name": "fieldVectors", "type": { "type": "array", "items": { "type": "array", "items": ["string", { "type": "array", "items": "float" }] } } },
      {
        "name": "invertedIndex", "type":
        {
          "type": "array", "items":
          {
            "type": "array", "items":
              ["string", {
                "type": "record", "fields": [
                  { "name": "_index", "type": "int" },
                  { "name": "field", "type": { "type": "map", "values": { "type": "record", "fields": [] } } }]
              }]
          }
        }
      }, { "name": "pipeline", "type": { "type": "array", "items": "null" } }]
  }
);