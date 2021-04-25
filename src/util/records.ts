import {UpdateRecordType} from "@src/contentscripts/bob3";

export const toBIND = (records: UpdateRecordType[]): string[] => {
  const binds = [];

  for (let r of records) {
    switch (r.type) {
      case "DS":
        binds.push(`${r.type}  ${r.keyTag}  ${r.algorithm}  ${r.digestType}  ${r.digest}`);
        break;
      case "GLUE4":
      case "GLUE6":
        binds.push(`${r.type}  ${r.ns}  ${r.address}`);
        break;
      case "NS":
        binds.push(`${r.type}  ${r.ns}`);
        break;
      case "SYNTH4":
      case "SYNTH6":
        binds.push(`${r.type}  ${r.address}`);
        break;
      case "TXT":
        r.txt.forEach(txt => {
          binds.push(`${r.type}  ${txt}`);
        });
        break;
      default:
        break;
    }
  }

  return binds;
};
