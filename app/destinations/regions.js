const COUNTRY_REGION = {
  // Europe
  Albania: 'Europe', Andorra: 'Europe', Austria: 'Europe', Belarus: 'Europe',
  Belgium: 'Europe', 'Bosnia and Herzegovina': 'Europe', Bulgaria: 'Europe',
  Croatia: 'Europe', 'Czech Republic': 'Europe', Denmark: 'Europe', Estonia: 'Europe',
  Finland: 'Europe', France: 'Europe', Germany: 'Europe', Greece: 'Europe',
  Hungary: 'Europe', Iceland: 'Europe', Ireland: 'Europe', Italy: 'Europe',
  Latvia: 'Europe', Lithuania: 'Europe', Luxembourg: 'Europe', Malta: 'Europe',
  Moldova: 'Europe', Monaco: 'Europe', Montenegro: 'Europe', Netherlands: 'Europe',
  'North Macedonia': 'Europe', Norway: 'Europe', Poland: 'Europe', Portugal: 'Europe',
  Romania: 'Europe', Russia: 'Europe', Serbia: 'Europe', Slovakia: 'Europe',
  Slovenia: 'Europe', Spain: 'Europe', Sweden: 'Europe', Switzerland: 'Europe',
  Ukraine: 'Europe', 'United Kingdom': 'Europe', Cyprus: 'Europe',

  // Asia
  Afghanistan: 'Asia', Bangladesh: 'Asia', Bhutan: 'Asia', Brunei: 'Asia',
  Cambodia: 'Asia', China: 'Asia', Georgia: 'Asia', India: 'Asia',
  Indonesia: 'Asia', Japan: 'Asia', Kazakhstan: 'Asia', Kyrgyzstan: 'Asia',
  Laos: 'Asia', Malaysia: 'Asia', Maldives: 'Asia', Mongolia: 'Asia',
  Myanmar: 'Asia', Nepal: 'Asia', Pakistan: 'Asia', Philippines: 'Asia',
  Singapore: 'Asia', 'South Korea': 'Asia', 'Sri Lanka': 'Asia', Taiwan: 'Asia',
  Tajikistan: 'Asia', Thailand: 'Asia', 'Timor-Leste': 'Asia', Turkmenistan: 'Asia',
  Uzbekistan: 'Asia', Vietnam: 'Asia', Armenia: 'Asia',

  // Middle East
  Bahrain: 'Middle East', Iran: 'Middle East', Iraq: 'Middle East', Israel: 'Middle East',
  Jordan: 'Middle East', Kuwait: 'Middle East', Lebanon: 'Middle East', Oman: 'Middle East',
  Palestine: 'Middle East', Qatar: 'Middle East', 'Saudi Arabia': 'Middle East',
  Syria: 'Middle East', Turkey: 'Middle East', 'United Arab Emirates': 'Middle East',
  Yemen: 'Middle East',

  // Americas
  'Antigua and Barbuda': 'Americas', Argentina: 'Americas', Bahamas: 'Americas',
  Barbados: 'Americas', Belize: 'Americas', Bolivia: 'Americas', Brazil: 'Americas',
  Canada: 'Americas', Chile: 'Americas', Colombia: 'Americas', 'Costa Rica': 'Americas',
  Cuba: 'Americas', 'Dominican Republic': 'Americas', Ecuador: 'Americas',
  'El Salvador': 'Americas', Guatemala: 'Americas', Haiti: 'Americas',
  Honduras: 'Americas', Jamaica: 'Americas', Mexico: 'Americas', Nicaragua: 'Americas',
  Panama: 'Americas', Paraguay: 'Americas', Peru: 'Americas', 'Puerto Rico': 'Americas',
  'Trinidad and Tobago': 'Americas', 'United States': 'Americas', Uruguay: 'Americas',
  Venezuela: 'Americas',

  // Africa
  Algeria: 'Africa', Angola: 'Africa', Benin: 'Africa', Botswana: 'Africa',
  'Burkina Faso': 'Africa', Burundi: 'Africa', Cameroon: 'Africa', 'Cape Verde': 'Africa',
  'Central African Republic': 'Africa', Chad: 'Africa', Comoros: 'Africa',
  Congo: 'Africa', Djibouti: 'Africa', Egypt: 'Africa', 'Equatorial Guinea': 'Africa',
  Eritrea: 'Africa', Eswatini: 'Africa', Ethiopia: 'Africa', Gabon: 'Africa',
  Gambia: 'Africa', Ghana: 'Africa', Guinea: 'Africa', 'Guinea-Bissau': 'Africa',
  'Ivory Coast': 'Africa', Kenya: 'Africa', Lesotho: 'Africa', Liberia: 'Africa',
  Libya: 'Africa', Madagascar: 'Africa', Malawi: 'Africa', Mali: 'Africa',
  Mauritania: 'Africa', Mauritius: 'Africa', Morocco: 'Africa', Mozambique: 'Africa',
  Namibia: 'Africa', Niger: 'Africa', Nigeria: 'Africa', Rwanda: 'Africa',
  Senegal: 'Africa', Seychelles: 'Africa', 'Sierra Leone': 'Africa', Somalia: 'Africa',
  'South Africa': 'Africa', 'South Sudan': 'Africa', Sudan: 'Africa', Tanzania: 'Africa',
  Togo: 'Africa', Tunisia: 'Africa', Uganda: 'Africa', Zambia: 'Africa', Zimbabwe: 'Africa',

  // Oceania
  Australia: 'Oceania', Fiji: 'Oceania', Kiribati: 'Oceania', 'Marshall Islands': 'Oceania',
  Micronesia: 'Oceania', Nauru: 'Oceania', 'New Zealand': 'Oceania', Palau: 'Oceania',
  'Papua New Guinea': 'Oceania', Samoa: 'Oceania', 'Solomon Islands': 'Oceania',
  Tonga: 'Oceania', Tuvalu: 'Oceania', Vanuatu: 'Oceania',
};

export function getRegion(country) {
  return COUNTRY_REGION[country] ?? 'Other';
}
