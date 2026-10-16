function cuidTimestamp(cuid: string): Date | null {
  // cuid v1: 'c' + base36 timestamp (first 8 chars after 'c') + ...
  const ts = parseInt(cuid.slice(1, 9), 36);
  if (isNaN(ts)) return null;
  return new Date(ts);
}

const ids: [string, string][] = [
  ['DEMO Role', 'cmv55nkd7000t4eog7co0sik3'],
  ['General manager (user931)', 'cmv51xv1800s4xbt9ah1ooosg'],
  ['demo101 User row', 'cmsn0nzyq0027zw6qfq0e8chx'],
  ['deleted designation (General manager)', 'cmv51tq0400rwxbt9ndsckm2e'],
];

ids.forEach(([label, id]) => console.log(label, '->', id, '-> created ~', cuidTimestamp(id)?.toISOString()));
