import { readFileSync, writeFileSync } from 'fs';

const regions = JSON.parse(readFileSync('src/data/regions.json', 'utf-8'));

// 适合五一旅游的省份编码
const SELECTED_CODES = [
  '11', '31', '50', '33', '53', '51', '35', '44',
  '45', '46', '52', '43', '32', '61', '37', '34',
  '42', '36', '54', '62',
];

// 直辖市编码：需要展平一层，直接取区
const MUNICIPALITIES = ['11', '31', '50'];

function cleanProvinceName(name) {
  return name.replace(/(省|市|壮族自治区|维吾尔自治区|回族自治区|自治区)$/, '');
}

function cleanCityName(name) {
  if (name.endsWith('自治州')) {
    return name.replace(/(?:[\u4e00-\u9fff]+族)+自治州$/, '');
  }
  return name.replace(/(市|地区)$/, '');
}

const result = regions
  .filter((p) => SELECTED_CODES.includes(p.code))
  .map((province) => {
    const name = cleanProvinceName(province.name);
    let cities;

    if (MUNICIPALITIES.includes(province.code)) {
      // 直辖市：展平 "市辖区" 层级，直接用区名
      const allDistricts = province.children.flatMap((c) => c.children || []);
      cities = allDistricts.map((d) => d.name);
    } else {
      cities = province.children.map((c) => cleanCityName(c.name));
    }

    return { name, cities };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

const output = `// 由 scripts/generate-travel-data.js 从 regions.json 自动生成
// 包含适合五一旅游的省份及其城市/地区列表
export const travelProvinces = ${JSON.stringify(result, null, 2)};
`;

writeFileSync('src/data/travel-regions.js', output, 'utf-8');
console.log(`已生成 ${result.length} 个省份的旅游数据`);
result.forEach((p) => console.log(`  ${p.name}: ${p.cities.length} 个城市`));
