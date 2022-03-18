import path from 'path';
import avro from 'avsc';

export const zDumpDir = path.join(process.cwd(), 'dump','A');
export const indexDir = path.join(process.cwd(), 'zimbee-frontend','public','index');
export const indexFile = path.join(indexDir,'pages');

  /** A basic logical type to automatically "unwrap" values. */
  let BoxT = class BoxTypeClass extends avro.types.LogicalType {
    _fromValue(val) { return val.unboxed; }
    _toValue(any) { return { unboxed: any }; }
  }

  export const indexSerializer = avro.Type.forSchema(
    {
      "name": "elasticlunr",
      "type": "record",
      "fields":
        [
          { "name": "version", "type": "string" },
          { "name": "fields", "type": { "type": "array", "items": "string" } },
          { "name": "ref", "type": "string" },
          {
            "name": "documentStore", "type":
            {
              "type": "record", "fields": [
                { "name": "docs", "type": { "type": "map", "values": "null" } },
                { "name": "docInfo", "type": { "type": "map", "values": { "type": "record", "fields": [{ "name": "field", "type": "int" }] } } },
                { "name": "length", "type": "int" },
                { "name": "save", "type": "boolean" }]
            }
          },
          {
            name: 'index', type: {
              name: 'RecursiveMap',
              type: 'record',
              logicalType: 'box', // Our logical type.
              fields: [
                {
                  name: 'unboxed',
                  type: {
                    type: 'map',
                    values: [
                      'null',
                      'int',
                      'RecursiveMap'
                    ]
                  }
                }
              ]
            }
          }
        ]
    }, { logicalTypes: { box: BoxT } }
  );