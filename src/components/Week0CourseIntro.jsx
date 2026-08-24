// Module 1 - Course Introduction: "What income do you need in retirement?"
//
// Ported from a standalone vanilla-JS artifact the user built and had saved
// under their personal GitHub (KRManning12/Personal-Website, "Project
// Artifacts/UNIV 154 - Retirement Salary Calculator/Retirement Salary
// Calculator.html" -- verbatim copy kept at
// reference/week1-course-intro-retirement-planner.html for provenance).
// This is a from-scratch React port (useState + JSX), not an iframe/HTML
// embed, so it behaves like every other module in the tool.
//
// Deliberately self-contained: the tax brackets / cost-of-living tables /
// lifestyle tiers below model a *hypothetical future retirement scenario*
// the student picks, not their current income -- this is NOT wired into
// utils/taxEngine.js or useAssumptions() (those model current-year income
// for the budgeting/tax modules). Keeping this independent means it can't
// drift from, or accidentally corrupt, the shared tax engine's assumptions.
import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

// ── Palette (kept from the original artifact -- already matches the site's
// navy/gold brand colors) ──
const C = {
  navy: '#1C2D6E', navyDk: '#141F52', navyMd: '#263A8A', navyLt: '#3B52A5', navyPale: '#EDF0FA', navyBdr: '#C2CAE8',
  white: '#FFFFFF', bg: '#F0F2F9', ink: '#0E1840', sub: '#4A5580', muted: '#7B85AA', border: '#D8DCF0', faint: '#B0BAD8',
  green: '#0F7A44', greenPale: '#E8F6EF', greenBdr: '#A8D8BE', amber: '#916200', amberPale: '#FFF8E8', amberBdr: '#E8CC80', gold: '#F5B800', red: '#B02020',
};
const BAR_COLORS = ['#1C2D6E', '#263A8A', '#3B52A5', '#5068C0', '#6A82D5', '#8099E0', '#2E7D5C', '#3DA374', '#50C090', '#C07010', '#D08820', '#E0A030', '#7040A0', '#9060C0', '#5090B0', '#3B8686', '#B05050'];

// System font stack already used elsewhere in the tool (Week4.jsx etc.) --
// intentionally not pulling in the original artifact's Google-Fonts Poppins
// dependency for one module.
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ── Tax Data (2026 brackets, verbatim from the source artifact) ──
function calcFederalTax(gross, filing) {
  if (filing === 'mfj') {
    const taxable = Math.max(0, gross - 32200);
    const B = [[24800, .10], [100800, .12], [211400, .22], [403550, .24], [512450, .32], [768700, .35], [Infinity, .37]];
    let tax = 0, prev = 0;
    for (const [top, r] of B) { if (taxable <= prev) break; tax += (Math.min(taxable, top) - prev) * r; prev = top; }
    return tax;
  }
  const taxable = Math.max(0, gross - 16100);
  const B = [[12400, .10], [50400, .12], [105700, .22], [201775, .24], [256225, .32], [640600, .35], [Infinity, .37]];
  let tax = 0, prev = 0;
  for (const [top, r] of B) { if (taxable <= prev) break; tax += (Math.min(taxable, top) - prev) * r; prev = top; }
  return tax;
}

const STATE_TAX = { "Alabama": { std: 3000, brackets: [[500, .02], [3000, .04], [Infinity, .05]] }, "Alaska": { std: 0, brackets: [[Infinity, 0]] }, "Arizona": { std: 8350, brackets: [[Infinity, .025]] }, "Arkansas": { std: 2470, brackets: [[4600, .02], [Infinity, .039]] }, "California": { std: 5540, brackets: [[11079, .01], [26264, .02], [41452, .04], [57542, .06], [72724, .08], [371479, .093], [445771, .103], [742953, .113], [1000000, .123], [Infinity, .133]] }, "Colorado": { std: 16100, brackets: [[Infinity, .044]] }, "Connecticut": { std: 0, personal: 15000, brackets: [[10000, .02], [50000, .045], [100000, .055], [200000, .06], [250000, .065], [500000, .069], [Infinity, .0699]] }, "Delaware": { std: 3250, brackets: [[2000, 0], [5000, .022], [10000, .039], [20000, .048], [25000, .052], [60000, .055], [Infinity, .066]] }, "Florida": { std: 0, brackets: [[Infinity, 0]] }, "Georgia": { std: 12000, brackets: [[Infinity, .0519]] }, "Hawaii": { std: 4400, brackets: [[9600, .014], [14400, .032], [19200, .055], [24000, .064], [36000, .068], [48000, .072], [125000, .076], [175000, .079], [225000, .0825], [275000, .09], [325000, .10], [Infinity, .11]] }, "Idaho": { std: 16100, brackets: [[4811, 0], [Infinity, .053]] }, "Illinois": { std: 0, personal: 2925, brackets: [[Infinity, .0495]] }, "Indiana": { std: 0, personal: 1000, brackets: [[Infinity, .0295]] }, "Iowa": { std: 16100, brackets: [[Infinity, .038]] }, "Kansas": { std: 3605, personal: 9160, brackets: [[23000, .052], [Infinity, .0558]] }, "Kentucky": { std: 3360, brackets: [[Infinity, .035]] }, "Louisiana": { std: 12875, brackets: [[Infinity, .03]] }, "Maine": { std: 8350, brackets: [[27399, .058], [64849, .0675], [Infinity, .0715]] }, "Maryland": { std: 3350, personal: 3200, brackets: [[1000, .02], [2000, .03], [3000, .04], [100000, .0475], [125000, .05], [150000, .0525], [250000, .055], [500000, .0575], [1000000, .0625], [Infinity, .065]] }, "Massachusetts": { std: 0, personal: 4400, brackets: [[1083150, .05], [Infinity, .09]] }, "Michigan": { std: 0, personal: 5900, brackets: [[Infinity, .0425]] }, "Minnesota": { std: 15300, brackets: [[33310, .0535], [109430, .068], [203150, .0785], [Infinity, .0985]] }, "Mississippi": { std: 2300, personal: 6000, brackets: [[10000, 0], [Infinity, .04]] }, "Missouri": { std: 16100, brackets: [[1348, 0], [2696, .02], [4044, .025], [5392, .03], [6740, .035], [8088, .04], [9436, .045], [Infinity, .047]] }, "Montana": { std: 16100, brackets: [[47500, .047], [Infinity, .0565]] }, "Nebraska": { std: 8850, brackets: [[4130, .0246], [24760, .0351], [Infinity, .0455]] }, "Nevada": { std: 0, brackets: [[Infinity, 0]] }, "New Hampshire": { std: 0, brackets: [[Infinity, 0]] }, "New Jersey": { std: 0, personal: 1000, brackets: [[20000, .014], [35000, .0175], [40000, .035], [75000, .0553], [500000, .0637], [1000000, .0897], [Infinity, .1075]] }, "New Mexico": { std: 16100, brackets: [[5500, .015], [16500, .032], [33500, .043], [66500, .047], [210000, .049], [Infinity, .059]] }, "New York": { std: 8000, brackets: [[8500, .039], [11700, .044], [13900, .0515], [80650, .054], [215400, .059], [1077550, .0685], [5000000, .0965], [25000000, .103], [Infinity, .109]] }, "North Carolina": { std: 12750, brackets: [[Infinity, .0399]] }, "North Dakota": { std: 16100, brackets: [[48475, 0], [244825, .0195], [Infinity, .025]] }, "Ohio": { std: 0, personal: 2400, brackets: [[26050, 0], [Infinity, .0275]] }, "Oklahoma": { std: 6350, personal: 1000, brackets: [[3750, 0], [4900, .025], [7200, .035], [Infinity, .045]] }, "Oregon": { std: 2910, brackets: [[4550, .0475], [11400, .0675], [125000, .0875], [Infinity, .099]] }, "Pennsylvania": { std: 0, brackets: [[Infinity, .0307]] }, "Rhode Island": { std: 11200, personal: 5250, brackets: [[82050, .0375], [186450, .0475], [Infinity, .0599]] }, "South Carolina": { std: 8350, brackets: [[3640, 0], [18230, .03], [Infinity, .06]] }, "South Dakota": { std: 0, brackets: [[Infinity, 0]] }, "Tennessee": { std: 0, brackets: [[Infinity, 0]] }, "Texas": { std: 0, brackets: [[Infinity, 0]] }, "Utah": { std: 0, brackets: [[Infinity, .045]] }, "Vermont": { std: 7650, personal: 5300, brackets: [[49400, .0335], [119700, .066], [249700, .076], [Infinity, .0875]] }, "Virginia": { std: 8750, personal: 930, brackets: [[3000, .02], [5000, .03], [17000, .05], [Infinity, .0575]] }, "Washington": { std: 0, brackets: [[Infinity, 0]] }, "West Virginia": { std: 0, personal: 2000, brackets: [[10000, .0222], [25000, .0296], [40000, .0333], [60000, .0444], [Infinity, .0482]] }, "Wisconsin": { std: 13960, brackets: [[15110, .035], [51950, .044], [332720, .053], [Infinity, .0765]] }, "Wyoming": { std: 0, brackets: [[Infinity, 0]] }, "Washington D.C.": { std: 16100, brackets: [[10000, .04], [40000, .06], [60000, .065], [250000, .085], [500000, .0925], [1000000, .0975], [Infinity, .1075]] } };

const CITY_TAX = { "Birmingham, AL": { state: "Alabama", flat: .01 }, "Bessemer, AL": { state: "Alabama", flat: .01 }, "Gadsden, AL": { state: "Alabama", flat: .02 }, "Louisville": { state: "Kentucky", flat: .022 }, "Lexington": { state: "Kentucky", flat: .0225 }, "Covington, KY": { state: "Kentucky", flat: .025 }, "Newport, KY": { state: "Kentucky", flat: .025 }, "Bowling Green, KY": { state: "Kentucky", flat: .0185 }, "Owensboro, KY": { state: "Kentucky", flat: .015 }, "Florence, KY": { state: "Kentucky", flat: .02 }, "Baltimore": { state: "Maryland", flat: .032 }, "Anne Arundel Co.": { state: "Maryland", flat: .0281 }, "Baltimore Co.": { state: "Maryland", flat: .032 }, "Frederick Co.": { state: "Maryland", flat: .0296 }, "Harford Co.": { state: "Maryland", flat: .0306 }, "Howard Co.": { state: "Maryland", flat: .032 }, "Montgomery Co.": { state: "Maryland", flat: .032 }, "Prince George's Co.": { state: "Maryland", flat: .032 }, "Worcester Co.": { state: "Maryland", flat: .0225 }, "Detroit": { state: "Michigan", flat: .024 }, "Grand Rapids": { state: "Michigan", flat: .015 }, "Highland Park, MI": { state: "Michigan", flat: .02 }, "Saginaw": { state: "Michigan", flat: .015 }, "Lansing": { state: "Michigan", flat: .01 }, "Flint": { state: "Michigan", flat: .01 }, "Jackson, MI": { state: "Michigan", flat: .01 }, "Battle Creek": { state: "Michigan", flat: .01 }, "Pontiac": { state: "Michigan", flat: .01 }, "Muskegon": { state: "Michigan", flat: .01 }, "East Lansing": { state: "Michigan", flat: .01 }, "Port Huron": { state: "Michigan", flat: .01 }, "Walker, MI": { state: "Michigan", flat: .01 }, "Kansas City": { state: "Missouri", flat: .01 }, "St. Louis": { state: "Missouri", flat: .01 }, "Newark, NJ": { state: "New Jersey", flat: .01 }, "New York City": { state: "New York", brackets: [[12000, .03078], [25000, .03762], [50000, .03819], [Infinity, .03876]] }, "Yonkers": { state: "New York", flat: .016975 }, "Columbus": { state: "Ohio", flat: .025 }, "Cleveland": { state: "Ohio", flat: .02 }, "Cincinnati": { state: "Ohio", flat: .018 }, "Toledo": { state: "Ohio", flat: .0225 }, "Akron": { state: "Ohio", flat: .025 }, "Dayton": { state: "Ohio", flat: .025 }, "Canton": { state: "Ohio", flat: .025 }, "Youngstown": { state: "Ohio", flat: .0275 }, "Parma": { state: "Ohio", flat: .025 }, "Lorain": { state: "Ohio", flat: .025 }, "Hamilton, OH": { state: "Ohio", flat: .02 }, "Springfield, OH": { state: "Ohio", flat: .02 }, "Mansfield, OH": { state: "Ohio", flat: .02 }, "Lima, OH": { state: "Ohio", flat: .015 }, "Newark, OH": { state: "Ohio", flat: .015 }, "Zanesville": { state: "Ohio", flat: .02 }, "Portland, OR": { state: "Oregon", flat: .01 }, "Philadelphia": { state: "Pennsylvania", flat: .038809 }, "Pittsburgh": { state: "Pennsylvania", flat: .03 }, "Reading, PA": { state: "Pennsylvania", flat: .036 }, "Scranton": { state: "Pennsylvania", flat: .034 }, "Wilkes-Barre": { state: "Pennsylvania", flat: .03 }, "Allentown": { state: "Pennsylvania", flat: .0185 }, "Bethlehem, PA": { state: "Pennsylvania", flat: .0185 }, "Erie, PA": { state: "Pennsylvania", flat: .0165 }, "Harrisburg": { state: "Pennsylvania", flat: .02 }, "Lancaster, PA": { state: "Pennsylvania", flat: .0185 }, "York, PA": { state: "Pennsylvania", flat: .0185 }, "Indianapolis": { state: "Indiana", flat: .02 }, "Fort Wayne": { state: "Indiana", flat: .015 }, "Evansville, IN": { state: "Indiana", flat: .012 }, "South Bend": { state: "Indiana", flat: .0175 } };

const CITIES_BY_STATE = {};
Object.entries(CITY_TAX).forEach(([city, { state }]) => {
  (CITIES_BY_STATE[state] = CITIES_BY_STATE[state] || []).push(city);
});

function calcStateTax(gross, name) {
  const s = STATE_TAX[name]; if (!s) return 0;
  const taxable = Math.max(0, gross - (s.std || 0) - (s.personal || 0));
  let tax = 0, prev = 0;
  for (const [top, r] of s.brackets) { if (taxable <= prev) break; tax += (Math.min(taxable, top) - prev) * r; prev = top; }
  return tax;
}
function calcCityTax(gross, city) {
  if (!city) return 0;
  const c = CITY_TAX[city]; if (!c) return 0;
  if (c.flat) return gross * c.flat;
  let tax = 0, prev = 0;
  for (const [top, r] of c.brackets) { if (gross <= prev) break; tax += (Math.min(gross, top) - prev) * r; prev = top; }
  return tax;
}

const STATES = Object.keys(STATE_TAX).sort();
// House convention: shared formatCurrency (whole-dollar, matches the
// artifact's original Math.round behavior) instead of a local fmt().
const fmt = (n) => formatCurrency(n, { decimals: 0 });
const pct = (a, b) => (b > 0 ? (a / b * 100).toFixed(1) + '%' : '0%');

const COL = { "Alabama": [0.70, 0.88], "Alaska": [1.30, 1.22], "Arizona": [1.05, 1.08], "Arkansas": [0.72, 0.89], "California": [2.10, 1.32], "Colorado": [1.18, 1.02], "Connecticut": [1.30, 1.10], "Delaware": [1.05, 1.00], "Florida": [1.10, 1.01], "Georgia": [0.88, 0.92], "Hawaii": [3.15, 1.65], "Idaho": [0.98, 0.99], "Illinois": [0.90, 0.94], "Indiana": [0.78, 0.91], "Iowa": [0.76, 0.90], "Kansas": [0.73, 0.88], "Kentucky": [0.75, 0.92], "Louisiana": [0.80, 0.92], "Maine": [1.12, 1.10], "Maryland": [1.25, 1.13], "Massachusetts": [1.75, 1.30], "Michigan": [0.80, 0.90], "Minnesota": [0.90, 0.94], "Mississippi": [0.66, 0.87], "Missouri": [0.78, 0.89], "Montana": [0.96, 0.95], "Nebraska": [0.80, 0.92], "Nevada": [1.02, 1.00], "New Hampshire": [1.20, 1.09], "New Jersey": [1.35, 1.13], "New Mexico": [0.84, 0.93], "New York": [1.60, 1.22], "North Carolina": [0.88, 0.97], "North Dakota": [0.82, 0.91], "Ohio": [0.76, 0.94], "Oklahoma": [0.70, 0.86], "Oregon": [1.20, 1.10], "Pennsylvania": [0.92, 0.97], "Rhode Island": [1.20, 1.08], "South Carolina": [0.86, 0.94], "South Dakota": [0.80, 0.92], "Tennessee": [0.82, 0.90], "Texas": [0.88, 0.92], "Utah": [1.05, 1.01], "Vermont": [1.15, 1.11], "Virginia": [1.05, 1.00], "Washington": [1.30, 1.12], "Washington D.C.": [2.00, 1.35], "West Virginia": [0.68, 0.88], "Wisconsin": [0.82, 0.97], "Wyoming": [0.88, 0.93] };

const CITY_HOUSING_PREMIUM = { "New York City": 2.20, "Yonkers": 1.30, "Philadelphia": 1.10, "Pittsburgh": 0.85, "Detroit": 0.65, "Grand Rapids": 0.90, "Baltimore": 1.15, "Montgomery Co.": 1.40, "Howard Co.": 1.35, "Prince George's Co.": 1.05, "Kansas City": 0.90, "St. Louis": 0.80, "Columbus": 0.88, "Cleveland": 0.75, "Cincinnati": 0.85, "Toledo": 0.70, "Akron": 0.70, "Dayton": 0.65, "Portland, OR": 1.30, "Louisville": 0.80, "Lexington": 0.85, "Indianapolis": 0.80, "Fort Wayne": 0.70, "South Bend": 0.65, "Reading, PA": 0.70, "Scranton": 0.65, "Erie, PA": 0.60, "Newark, NJ": 1.05 };

function getMultipliers(stateName, cityName) {
  const base = COL[stateName] || [1.0, 1.0];
  let housing = base[0];
  const general = base[1];
  if (cityName && CITY_HOUSING_PREMIUM[cityName]) housing = housing * CITY_HOUSING_PREMIUM[cityName];
  return { housing, general };
}

const r5 = (n) => Math.round(n / 5) * 5;
const MORTGAGE_ADDERS = { modest: 800, comfortable: 1200, upscale: 2000, luxury: 3500 };
const SPOUSE_ADDERS = { housing: 0, homeCare: 0, car: 0.60, food: 0.50, healthcare: 1.00, fitness: 0.75, therapy: 1.00, lifestyle: 0.30, vacation: 0.50, clothing: 1.00, personalCare: 1.00, streaming: 0.25, gifts: 0.30 };
const CHILD_ADDERS = { food: 300, healthcare: 250, clothing: 100, personalCare: 50, streaming: 50 };

const TIERS = {
  housingOwn: { modest: { label: 'Modest', sub: 'Smaller home, lower-cost area', eg: '3BR ranch in a mid-size Midwest city', base: 900 }, comfortable: { label: 'Comfortable', sub: 'Mid-size home, suburban area', eg: '4BR colonial in a nice suburb', base: 1600 }, upscale: { label: 'Upscale', sub: 'Large home in a desirable area', eg: '5BR in a premier suburb or coastal town', base: 2800 }, luxury: { label: 'Luxury', sub: 'Estate, penthouse, resort home', eg: 'Oceanfront home or gated community', base: 6000 } },
  housingRent: { modest: { label: 'Modest', sub: 'Studio/1BR in affordable area', eg: 'Cozy 1BR in a mid-tier city', base: 1100 }, comfortable: { label: 'Comfortable', sub: '1–2BR in a mid-tier city', eg: 'Modern 2BR in a walkable neighborhood', base: 1800 }, upscale: { label: 'Upscale', sub: '2–3BR in a desirable area', eg: 'Renovated 3BR near beach or downtown', base: 3200 }, luxury: { label: 'Luxury', sub: 'Full-service, premium location', eg: 'White-glove doorman building in a top city', base: 7000 } },
  homeCare: { none: { label: 'None', sub: 'DIY everything', eg: 'Mow your own lawn, clean yourself', base: 0 }, basic: { label: 'Basic', sub: 'Lawn care + occasional cleaning', eg: 'Biweekly maid, monthly lawn service', base: 250 }, full: { label: 'Full-Service', sub: 'Housekeeper, landscaper, handyman', eg: 'Weekly cleaning, full yard care, repairs', base: 600 }, premium: { label: 'Premium', sub: 'Full staff or concierge service', eg: 'Daily housekeeper, pool service, gardener', base: 1500 } },
  carOwn: { none: { label: 'No Car', sub: 'Transit, Uber & walking', eg: 'Walkable city, no car at all', base: 200 }, economy: { label: 'Economy', sub: 'Paid-off older reliable vehicle', eg: '10-yr-old Camry — just gas, insurance, maintenance', base: 350 }, midrange: { label: 'Mid-Range', sub: 'Financed mainstream vehicle', eg: 'New Honda CR-V with a 5-year loan', base: 650 }, luxury: { label: 'Luxury', sub: 'Premium vehicle, full coverage', eg: 'BMW 5-Series or Mercedes E-Class', base: 1200 }, ultra: { label: 'Ultra', sub: 'Multiple or exotic vehicles', eg: 'Porsche + daily driver', base: 2800 } },
  carLease: { none: { label: 'No Car', sub: 'Transit, Uber & walking', eg: 'Walkable city, no car at all', base: 200 }, economy: { label: 'Economy', sub: 'Basic lease + insurance & gas', eg: 'Leased Corolla or Civic', base: 500 }, midrange: { label: 'Mid-Range', sub: 'Mid-tier lease + insurance & gas', eg: 'Leased RAV4 or CR-V', base: 800 }, luxury: { label: 'Luxury', sub: 'Premium lease, full coverage', eg: 'Leased BMW 5-Series or Audi A6', base: 1500 }, ultra: { label: 'Ultra', sub: 'Multiple or exotic leases', eg: 'Leased Porsche + daily driver', base: 3500 } },
  food: { frugal: { label: 'Frugal', sub: 'Primarily cooking at home', eg: 'Farmers market, occasional takeout', base: 350 }, balanced: { label: 'Balanced', sub: 'Home cooking + dining out', eg: '3–4 restaurant meals per week', base: 600 }, social: { label: 'Social', sub: 'Frequent dining & delivery', eg: 'Daily coffee shops, regular fine dining', base: 1000 }, luxury: { label: 'Luxury', sub: 'High-end restaurants, premium food', eg: 'Michelin-starred meals, private chef nights', base: 2500 } },
  fitness: { none: { label: 'None', sub: 'Parks, walks, outdoor only', eg: 'Free trails and outdoor activities', base: 0 }, basic: { label: 'Basic', sub: 'Standard gym or YMCA', eg: 'Planet Fitness or local rec center', base: 50 }, premium: { label: 'Premium', sub: 'High-end gym + trainer', eg: 'Equinox + weekly trainer sessions', base: 550 }, luxury: { label: 'Luxury', sub: 'Country club, spa, coaching', eg: 'Golf club membership + weekly massage', base: 1200 } },
  therapy: { none: { label: 'None', sub: 'No regular therapy', eg: '', base: 0 }, occasional: { label: 'Occasional', sub: '~2x per month', eg: 'Biweekly check-ins', base: 400 }, regular: { label: 'Regular', sub: 'Weekly sessions', eg: 'Standard weekly therapy', base: 800 } },
  lifestyle: { minimal: { label: 'Minimal', sub: 'Simple hobbies, local activities', eg: 'Reading, gardening, local events', base: 300 }, active: { label: 'Active', sub: 'Regular hobbies & experiences', eg: 'Golf, concerts, sports tickets', base: 800 }, abundant: { label: 'Abundant', sub: 'Rich & frequent experiences', eg: 'Season tickets, theatre, wine club', base: 1800 }, luxury: { label: 'Luxury', sub: 'Premium experiences without limits', eg: 'Private events, yacht club, art collecting', base: 5000 } },
  vacation: { none: { label: 'None', sub: 'No planned travel', eg: '', base: 0 }, domestic: { label: 'Domestic', sub: '1–2 US trips/year', eg: 'Road trips, national parks, family visits', base: 300 }, international: { label: 'International', sub: '1–2 intl trips/year', eg: 'Europe or Caribbean once a year', base: 700 }, frequent: { label: 'Frequent', sub: 'Multiple premium trips', eg: 'Business class, 3–4 trips, luxury hotels', base: 2500 }, luxury: { label: 'Luxury', sub: 'First-class, private travel', eg: 'Private jets, yacht charters, villa rentals', base: 8000 } },
  streaming: { minimal: { label: 'Basic', sub: 'Phone, internet & 1–2 streaming services', eg: 'Phone bill + Netflix or one other service', base: 120 }, standard: { label: 'Standard', sub: 'Phone, internet, streaming bundle & music', eg: 'Phone, home internet, Netflix/Hulu/HBO, Spotify, NYT', base: 250 }, full: { label: 'Connected', sub: 'Full suite: streaming, software, cloud', eg: 'All streaming + Adobe/software subs + cloud storage upgrades', base: 400 }, luxury: { label: 'Tech-Forward', sub: 'Premium devices, services, smart home', eg: 'Latest iPhone, smart home devices, all services, device upgrades', base: 700 } },
  gifts: { minimal: { label: 'Minimal', sub: 'Close family only', eg: 'Christmas and birthdays for immediate family', base: 50 }, generous: { label: 'Generous', sub: 'Family & friends, holidays', eg: 'Thoughtful gifts for ~15 people/year', base: 400 }, lavish: { label: 'Lavish', sub: 'Frequent & generous giving', eg: 'Luxury gifts, surprise trips for loved ones', base: 1200 } },
  clothing: { minimal: { label: 'Minimal', sub: 'Basics & replacements only', eg: 'Replace worn items, thrift shops', base: 75 }, moderate: { label: 'Moderate', sub: 'Seasonal wardrobe updates', eg: 'A few new outfits each season', base: 200 }, stylish: { label: 'Stylish', sub: 'Regular shopping, quality brands', eg: 'Department stores, name brands', base: 500 }, luxury: { label: 'Luxury', sub: 'Designer, tailored, high-end', eg: 'Designer labels, custom tailoring', base: 1200 } },
  personalCare: { minimal: { label: 'Minimal', sub: 'Basics — haircuts & hygiene', eg: 'Great Clips, drugstore products', base: 50 }, moderate: { label: 'Moderate', sub: 'Regular grooming & products', eg: 'Salon haircuts, quality skincare', base: 150 }, premium: { label: 'Premium', sub: 'Spa visits, premium products', eg: 'Monthly facials, premium brands', base: 400 }, luxury: { label: 'Luxury', sub: 'Full personal care regimen', eg: 'Weekly spa, dermatologist, luxury products', base: 900 } },
  pets: { none: { label: 'No Pets', sub: 'No pet expenses', eg: '', base: 0 }, basic: { label: 'Basic', sub: 'One low-maintenance pet', eg: 'Cat or small dog — food, litter, annual vet', base: 150 }, premium: { label: 'Premium', sub: 'One or more pets, quality care', eg: 'Dog with grooming, insurance, quality food', base: 350 }, luxury: { label: 'Luxury', sub: 'Multiple pets or premium services', eg: 'Dog walker, pet insurance, boarding, specialty vet', base: 700 } },
  charity: { none: { label: 'None', sub: 'No planned giving', pct: 0 }, occasional: { label: '~1%', sub: 'Occasional giving', pct: .01 }, intentional: { label: '~5%', sub: 'Intentional giving', pct: .05 }, tithing: { label: '~10%', sub: 'Tithing', pct: .10 } },
};

const STEP_NAMES = ['Welcome', 'Household', 'Location', 'Housing', 'Transportation', 'Food', 'Healthcare', 'Wellness', 'Lifestyle', 'Pets', 'Appearance', 'Technology', 'Giving', 'Results'];
const LAST_INPUT = STEP_NAMES.length - 2;
const RESULTS_STEP = STEP_NAMES.length - 1;

function getInitialForm() {
  return {
    name: '', household: 'single', numDependents: 1,
    retireState: '', retireCity: '',
    housingType: 'own', mortgagePaidOff: 'yes', housingTier: 'comfortable', housingAmt: '',
    homeCareTier: 'none', homeCareAmt: '',
    carType: 'own', carTier: 'midrange', carAmt: '',
    foodTier: 'balanced', foodAmt: '',
    healthcareAmt: 833,
    fitnessTier: 'basic', fitnessAmt: '',
    therapyTier: 'none', therapyAmt: '',
    lifestyleTier: 'active', lifestyleAmt: '',
    vacationTier: 'domestic', vacationAmt: '',
    clothingTier: 'moderate', clothingAmt: '',
    personalCareTier: 'moderate', personalCareAmt: '',
    petsTier: 'none', petsAmt: '',
    streamTier: 'standard', streamAmt: '',
    giftsTier: 'generous', giftsAmt: '',
    charityTier: 'occasional',
  };
}

function getHousingBase(tierKey, housingType, mortgagePaidOff) {
  const tierSet = housingType === 'own' ? TIERS.housingOwn : TIERS.housingRent;
  let base = tierSet[tierKey]?.base || 0;
  if (housingType === 'own' && mortgagePaidOff === 'no') base += (MORTGAGE_ADDERS[tierKey] || 0);
  return base;
}

// Recompute every auto-derived $ amount from the currently-selected tiers --
// used only when state/city changes (mirrors the original's applyTierDefaults()).
function applyAllTierDefaults(base) {
  const { housing: hm, general: gm } = getMultipliers(base.retireState, base.retireCity);
  const hBase = getHousingBase(base.housingTier, base.housingType, base.mortgagePaidOff);
  const carT = base.carType === 'lease' ? TIERS.carLease : TIERS.carOwn;
  return {
    ...base,
    housingAmt: hBase > 0 ? r5(hBase * hm) : 0,
    homeCareAmt: TIERS.homeCare[base.homeCareTier]?.base ?? 0,
    foodAmt: r5((TIERS.food[base.foodTier]?.base || 0) * gm),
    fitnessAmt: r5((TIERS.fitness[base.fitnessTier]?.base || 0) * gm),
    lifestyleAmt: r5((TIERS.lifestyle[base.lifestyleTier]?.base || 0) * gm),
    clothingAmt: r5((TIERS.clothing[base.clothingTier]?.base || 0) * gm),
    personalCareAmt: r5((TIERS.personalCare[base.personalCareTier]?.base || 0) * gm),
    petsAmt: TIERS.pets[base.petsTier]?.base ?? 0,
    carAmt: carT[base.carTier]?.base ?? 0,
    therapyAmt: TIERS.therapy[base.therapyTier]?.base ?? 0,
    vacationAmt: TIERS.vacation[base.vacationTier]?.base ?? 0,
    streamAmt: TIERS.streaming[base.streamTier]?.base ?? 0,
    giftsAmt: TIERS.gifts[base.giftsTier]?.base ?? 0,
  };
}

// Recompute just the ONE amount tied to a single tier-button click (mirrors
// the original's per-field branch inside its tier-click listener).
const TIER_AMT_FIELDS = ['housingTier', 'housingType', 'mortgagePaidOff', 'homeCareTier', 'carTier', 'carType', 'foodTier', 'fitnessTier', 'therapyTier', 'lifestyleTier', 'vacationTier', 'streamTier', 'giftsTier', 'clothingTier', 'personalCareTier', 'petsTier'];
function applyOneTierDefault(next, field) {
  const mults = getMultipliers(next.retireState, next.retireCity);
  if (field === 'housingTier' || field === 'housingType' || field === 'mortgagePaidOff') {
    const base = getHousingBase(next.housingTier, next.housingType, next.mortgagePaidOff);
    next.housingAmt = base > 0 ? r5(base * mults.housing) : 0;
  }
  if (field === 'homeCareTier') next.homeCareAmt = TIERS.homeCare[next.homeCareTier]?.base ?? 0;
  if (field === 'carTier' || field === 'carType') { const ct = next.carType === 'lease' ? TIERS.carLease : TIERS.carOwn; next.carAmt = ct[next.carTier]?.base ?? 0; }
  if (field === 'foodTier') next.foodAmt = r5((TIERS.food[next.foodTier]?.base || 0) * mults.general);
  if (field === 'fitnessTier') next.fitnessAmt = r5((TIERS.fitness[next.fitnessTier]?.base || 0) * mults.general);
  if (field === 'therapyTier') next.therapyAmt = TIERS.therapy[next.therapyTier]?.base ?? 0;
  if (field === 'lifestyleTier') next.lifestyleAmt = r5((TIERS.lifestyle[next.lifestyleTier]?.base || 0) * mults.general);
  if (field === 'vacationTier') next.vacationAmt = TIERS.vacation[next.vacationTier]?.base ?? 0;
  if (field === 'streamTier') next.streamAmt = TIERS.streaming[next.streamTier]?.base ?? 0;
  if (field === 'giftsTier') next.giftsAmt = TIERS.gifts[next.giftsTier]?.base ?? 0;
  if (field === 'clothingTier') next.clothingAmt = r5((TIERS.clothing[next.clothingTier]?.base || 0) * mults.general);
  if (field === 'personalCareTier') next.personalCareAmt = r5((TIERS.personalCare[next.personalCareTier]?.base || 0) * mults.general);
  if (field === 'petsTier') next.petsAmt = TIERS.pets[next.petsTier]?.base ?? 0;
  return next;
}

function calcResults(form) {
  const base = { housing: parseFloat(form.housingAmt) || 0, homeCare: parseFloat(form.homeCareAmt) || 0, car: parseFloat(form.carAmt) || 0, food: parseFloat(form.foodAmt) || 0, healthcare: parseFloat(form.healthcareAmt) || 0, fitness: parseFloat(form.fitnessAmt) || 0, therapy: parseFloat(form.therapyAmt) || 0, lifestyle: parseFloat(form.lifestyleAmt) || 0, vacation: parseFloat(form.vacationAmt) || 0, streaming: parseFloat(form.streamAmt) || 0, gifts: parseFloat(form.giftsAmt) || 0, clothing: parseFloat(form.clothingAmt) || 0, personalCare: parseFloat(form.personalCareAmt) || 0, pets: parseFloat(form.petsAmt) || 0 };
  const mo = { ...base };
  const hasSpouse = form.household === 'couple' || form.household === 'family';
  if (hasSpouse) { for (const [key, pctA] of Object.entries(SPOUSE_ADDERS)) { if (mo[key] !== undefined) mo[key] = Math.round(mo[key] * (1 + pctA)); } }
  const nc = form.household === 'family' ? (parseInt(form.numDependents) || 1) : 0;
  if (nc > 0) { for (const [key, flatA] of Object.entries(CHILD_ADDERS)) { if (mo[key] !== undefined) mo[key] += flatA * nc; } }
  const annual = Object.values(mo).reduce((a, b) => a + b, 0) * 12;
  const cPct = TIERS.charity[form.charityTier].pct || 0;
  const f = hasSpouse ? 'mfj' : 'single';
  let gross = annual * 1.5;
  for (let i = 0; i < 20; i++) { const fed = calcFederalTax(gross, f), st = calcStateTax(gross, form.retireState), ct = calcCityTax(gross, form.retireCity), ch = gross * cPct; gross = annual + fed + st + ct + ch; }
  gross = Math.ceil(gross / 500) * 500;
  const fedTax = calcFederalTax(gross, f), stateTax = calcStateTax(gross, form.retireState), cityTax = calcCityTax(gross, form.retireCity), charity = gross * cPct;
  return { gross, fedTax, stateTax, cityTax, charity, takeHome: gross - fedTax - stateTax - cityTax - charity, mo, base, cPct };
}

// ── Presentational helpers ──
function Pill({ text }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.navyPale, border: `1px solid ${C.navyBdr}`, borderRadius: 20, padding: '5px 14px', marginBottom: 18 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.navyMd, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.navyMd }}>{text}</span>
    </div>
  );
}

const NOTE_MAP = {
  blue: { bg: C.navyPale, bdr: C.navyBdr, txt: C.navy, icon: 'ℹ' },
  amber: { bg: C.amberPale, bdr: C.amberBdr, txt: C.amber, icon: '⚠' },
  green: { bg: C.greenPale, bdr: C.greenBdr, txt: C.green, icon: '✓' },
};
function Note({ children, type = 'blue' }) {
  const m = NOTE_MAP[type] || NOTE_MAP.blue;
  return (
    <div style={{ display: 'flex', gap: 11, background: m.bg, border: `1px solid ${m.bdr}`, borderRadius: 10, padding: '13px 16px', marginBottom: 18 }}>
      <span style={{ fontSize: 14, color: m.txt, flexShrink: 0, marginTop: 1 }}>{m.icon}</span>
      <div style={{ fontSize: 12.5, color: m.txt, lineHeight: 1.75, fontWeight: 400 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, badge }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: C.sub, marginBottom: 8 }}>
      {children}
      {badge && (
        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: C.navyPale, color: C.navyMd, border: `1px solid ${C.navyBdr}`, borderRadius: 10, padding: '2px 8px', verticalAlign: 'middle', textTransform: 'none', letterSpacing: 0 }}>
          {'📍'} {badge}
        </span>
      )}
    </div>
  );
}

function DollarInput({ value, placeholder = '0', dollar = true, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      {dollar && <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.faint, fontSize: 14, pointerEvents: 'none' }}>$</span>}
      <input
        type="number"
        value={value !== undefined && value !== null ? value : ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 14, padding: dollar ? '11px 13px 11px 28px' : '11px 13px', outline: 'none', fontWeight: 400 }}
        onFocus={(e) => { e.target.style.borderColor = C.navyMd; e.target.style.background = '#FAFBFF'; }}
        onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.background = C.white; }}
      />
    </div>
  );
}

function FieldSelect({ value, options, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', appearance: 'none', background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 14, padding: '11px 36px 11px 13px', outline: 'none', fontWeight: 400, cursor: 'pointer' }}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.muted, fontSize: 12 }}>{'▾'}</span>
    </div>
  );
}

function Hint({ children }) {
  return <div style={{ fontSize: 11, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>{children}</div>;
}

function tierHint(t, mult) {
  const adjustedBase = t.base !== undefined && t.base > 0 ? r5(t.base * mult) : t.base;
  if (adjustedBase !== undefined && adjustedBase > 0) return `~${fmt(adjustedBase)}/mo`;
  if (adjustedBase === 0) return 'Free';
  if (t.pct != null) return `${(t.pct * 100).toFixed(0)}% of income`;
  return undefined;
}

function TierButton({ selected, label, sub, eg, hint, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${selected ? C.navyMd : C.border}`,
        background: selected ? C.navyPale : C.white,
        borderRadius: 10, padding: '13px 14px', cursor: 'pointer',
        boxShadow: selected ? `0 0 0 3px ${C.navyBdr}` : 'none',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: selected ? C.navy : C.ink, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.4 }}>{sub}</div>
      {eg ? <div style={{ fontSize: 10, color: selected ? C.navyLt : C.faint, fontStyle: 'italic', marginTop: 4, lineHeight: 1.35 }}>{eg}</div> : null}
      {hint ? <div style={{ fontSize: 11, fontWeight: 600, color: selected ? C.navyMd : C.muted, marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

function TierGrid({ tiersObj, selectedKey, onSelect, cols = 4, mult = 1.0 }) {
  const entries = Object.entries(tiersObj);
  const actualCols = Math.min(cols, entries.length);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${actualCols}, 1fr)`, gap: 10, marginBottom: 14 }}>
      {entries.map(([k, t]) => (
        <TierButton key={k} selected={selectedKey === k} label={t.label} sub={t.sub} eg={t.eg} hint={tierHint(t, mult)} onClick={() => onSelect(k)} />
      ))}
    </div>
  );
}

function HousingTierGrid({ form, onSelect }) {
  const tierSet = form.housingType === 'own' ? TIERS.housingOwn : TIERS.housingRent;
  const mults = getMultipliers(form.retireState, form.retireCity);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
      {Object.entries(tierSet).map(([k, t]) => {
        const eb = getHousingBase(k, form.housingType, form.mortgagePaidOff);
        const adj = eb > 0 ? r5(eb * mults.housing) : 0;
        const hint = adj > 0 ? `~${fmt(adj)}/mo` : 'Free';
        return <TierButton key={k} selected={form.housingTier === k} label={t.label} sub={t.sub} eg={t.eg} hint={hint} onClick={() => onSelect(k)} />;
      })}
    </div>
  );
}

// ── Main component ──
export default function Week0CourseIntro() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(getInitialForm);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFieldChange = (field, value) => {
    if (field === 'retireState') {
      setForm((prev) => {
        const next = { ...prev, retireState: value, retireCity: '' };
        return value ? applyAllTierDefaults(next) : next;
      });
    } else if (field === 'retireCity') {
      setForm((prev) => {
        const next = { ...prev, retireCity: value };
        return next.retireState ? applyAllTierDefaults(next) : next;
      });
    } else {
      setField(field, value);
    }
  };

  const handleTierClick = (field, rawVal) => {
    setForm((prev) => {
      const val = field === 'numDependents' ? parseInt(rawVal, 10) : rawVal;
      let next = { ...prev, [field]: val };
      if (TIER_AMT_FIELDS.includes(field)) next = applyOneTierDefault({ ...next }, field);
      return next;
    });
  };

  const hasSpouse = form.household === 'couple' || form.household === 'family';
  const numChildren = form.household === 'family' ? (parseInt(form.numDependents) || 1) : 0;
  const filing = hasSpouse ? 'mfj' : 'single';
  const getCarTiers = () => (form.carType === 'lease' ? TIERS.carLease : TIERS.carOwn);
  const householdLabel = form.household === 'single' ? 'Individual' : form.household === 'couple' ? 'Couple' : `Family (2 adults + ${numChildren} dependent${numChildren > 1 ? 's' : ''})`;
  const incomeLabel = form.household === 'single' ? 'Required Annual Retirement Income' : 'Required Household Retirement Income';

  const canNext = step === 2 ? !!form.retireState : true;

  const goNext = () => { setStep((s) => s + 1); window.scrollTo(0, 0); };
  const goBack = () => { setStep((s) => s - 1); window.scrollTo(0, 0); };
  const startOver = () => { setForm(getInitialForm()); setStep(0); window.scrollTo(0, 0); };

  // ── Steps ──
  function renderStep0() {
    return (
      <>
        <Pill text="Getting Started" />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.ink, margin: '0 0 10px', lineHeight: 1.25 }}>What income do you need<br />in retirement?</h1>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 22px', lineHeight: 1.75 }}>Figure out how much gross income your household needs in retirement — based on where you live, how you spend, and 2026 tax brackets.</p>
        <Note>We'll walk you through each spending category. Pick the lifestyle level that fits, and we'll do the math — including taxes.</Note>
        <FieldLabel>Your First Name (optional)</FieldLabel>
        <input
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="e.g. Jordan"
          style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 14, padding: '11px 13px', outline: 'none', background: C.white }}
        />
      </>
    );
  }

  function renderStep1() {
    const hhOpts = [
      { k: 'single', label: 'Just Me', sub: 'Single person' },
      { k: 'couple', label: 'Me + Spouse/Partner', sub: 'Two adults, one household' },
      { k: 'family', label: 'Spouse + Dependents', sub: 'Includes a spouse/partner AND dependents' },
    ];
    return (
      <>
        <Pill text="Household" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Who are you planning for?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 22px', lineHeight: 1.75 }}>Tell us your household size. You'll enter your own lifestyle preferences — we'll scale the total automatically.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {hhOpts.map((o) => (
            <TierButton key={o.k} selected={form.household === o.k} label={o.label} sub={o.sub} onClick={() => handleTierClick('household', o.k)} />
          ))}
        </div>
        {form.household === 'family' && (
          <div style={{ marginTop: 10 }}>
            <FieldLabel>How many dependents beyond your spouse?</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[1, 2, 3].map((n) => (
                <TierButton
                  key={n}
                  selected={form.numDependents === n}
                  label={n === 3 ? '3+' : String(n)}
                  sub={n === 1 ? 'One dependent' : n === 2 ? 'Two dependents' : 'Three or more'}
                  onClick={() => handleTierClick('numDependents', n)}
                />
              ))}
            </div>
          </div>
        )}
        {form.household !== 'single' && (
          <Note>
            <strong>How it works:</strong> Enter your own preferences — we'll scale for your household automatically.
            {hasSpouse && ' Spouse adds to per-person costs (healthcare, clothing, therapy) and partially to shared costs (food, transportation). Housing stays the same.'}
            {numChildren > 0 && ` Each dependent adds $300 food, $250 healthcare, $100 clothing, $50 personal care, $50 tech per month.`}
          </Note>
        )}
        {hasSpouse && <Note type="green">Tax filing set to <strong>Married Filing Jointly</strong> (bigger brackets, $32,200 standard deduction).</Note>}
      </>
    );
  }

  function renderStep2() {
    const stateOpts = [{ value: '', label: 'Select state…' }, ...STATES.map((s) => ({ value: s, label: s }))];
    const hasNoTax = form.retireState && STATE_TAX[form.retireState]?.brackets?.every(([, r]) => r === 0);
    const top = form.retireState ? STATE_TAX[form.retireState]?.brackets?.slice(-1)[0]?.[1] : null;
    const bracketCount = form.retireState ? (STATE_TAX[form.retireState]?.brackets?.filter(([, r]) => r > 0).length || 0) : 0;
    const colIdx = form.retireState ? (COL[form.retireState] ? Math.round(COL[form.retireState][1] * 100) : 100) : 100;
    const housingIdx = form.retireState ? (COL[form.retireState] ? Math.round(COL[form.retireState][0] * 100) : 100) : 100;
    const colDesc = colIdx >= 115 ? 'significantly above' : colIdx >= 105 ? 'above' : colIdx <= 85 ? 'significantly below' : colIdx <= 95 ? 'below' : 'near';
    const cities = form.retireState ? (CITIES_BY_STATE[form.retireState] || []) : [];
    return (
      <>
        <Pill text="Location" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Where will you retire?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 22px', lineHeight: 1.75 }}>Your state and city determine how much of your income goes to taxes.</p>
        <FieldLabel>Retirement State</FieldLabel>
        <FieldSelect value={form.retireState} options={stateOpts} onChange={(v) => handleFieldChange('retireState', v)} />
        {form.retireState && (
          <>
            {hasNoTax ? (
              <Note type="green"><strong>{form.retireState}</strong> has <strong>no state income tax</strong> — your tax bill here will only include federal (and city, if applicable). 🎉</Note>
            ) : (
              <Note><strong>{form.retireState}</strong> uses a <strong>progressive {bracketCount}-bracket system</strong> with a top marginal rate of <strong>{(top * 100).toFixed(2)}%</strong>.</Note>
            )}
            <Note>
              <strong>Cost of living:</strong> {form.retireState} is <strong>{colDesc} the national average</strong> (general: {colIdx} · housing: {housingIdx}, where 100 = US avg). Tier estimates will reflect local costs.
            </Note>
            {cities.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <FieldLabel>Living in one of these cities? (adds city income tax)</FieldLabel>
                <FieldSelect
                  value={form.retireCity}
                  options={[{ value: '', label: 'No city tax / outside these cities' }, ...cities.map((c) => ({ value: c, label: `${c} (${CITY_TAX[c].flat ? (CITY_TAX[c].flat * 100).toFixed(3) + '%' : 'progressive'})` }))]}
                  onChange={(v) => handleFieldChange('retireCity', v)}
                />
              </div>
            )}
          </>
        )}
      </>
    );
  }

  function renderStep3() {
    return (
      <>
        <Pill text="Housing" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Where will you live?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 20px', lineHeight: 1.75 }}>Typically your biggest retirement expense.{hasSpouse ? ' Housing is shared — no extra cost for your spouse.' : ''}</p>
        <FieldLabel>Own or rent?</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <TierButton selected={form.housingType === 'own'} label="Own a Home" sub="Property taxes, maintenance, insurance" onClick={() => handleTierClick('housingType', 'own')} />
          <TierButton selected={form.housingType === 'rent'} label="Rent" sub="Monthly rent payments" onClick={() => handleTierClick('housingType', 'rent')} />
        </div>
        {form.housingType === 'own' && (
          <div style={{ marginBottom: 20 }}>
            <FieldLabel>Mortgage paid off?</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <TierButton selected={form.mortgagePaidOff === 'yes'} label="Paid Off" sub="Taxes, insurance & maintenance only" onClick={() => handleTierClick('mortgagePaidOff', 'yes')} />
              <TierButton selected={form.mortgagePaidOff === 'no'} label="Still Paying" sub="Mortgage + taxes, insurance & maintenance" onClick={() => handleTierClick('mortgagePaidOff', 'no')} />
            </div>
          </div>
        )}
        <FieldLabel badge={form.retireState || undefined}>Lifestyle level</FieldLabel>
        <HousingTierGrid form={form} onSelect={(k) => handleTierClick('housingTier', k)} />
        <FieldLabel>Monthly housing cost</FieldLabel>
        <DollarInput value={form.housingAmt} onChange={(v) => setField('housingAmt', v)} />
        <Hint>{form.housingType === 'own' ? (form.mortgagePaidOff === 'yes' ? 'Includes property taxes, insurance, HOA, and maintenance' : 'Includes mortgage payment, property taxes, insurance, HOA, and maintenance') : "Monthly rent including utilities and renter's insurance"}</Hint>
        <div style={{ marginTop: 26 }}>
          <FieldLabel>Home Care (housekeeper, landscaper, handyman)</FieldLabel>
          <TierGrid tiersObj={TIERS.homeCare} selectedKey={form.homeCareTier} onSelect={(k) => handleTierClick('homeCareTier', k)} cols={2} mult={1.0} />
          <DollarInput value={form.homeCareAmt} onChange={(v) => setField('homeCareAmt', v)} />
          <Hint>Cleaning, lawn care, pool service, handyman, snow removal, etc.</Hint>
        </div>
      </>
    );
  }

  function renderStep4() {
    return (
      <>
        <Pill text="Transportation" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>How will you get around?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 20px', lineHeight: 1.75 }}>Each tier covers everything: payment, fuel, insurance, and upkeep.{hasSpouse ? ' Spouse car costs (+60%) added in results.' : ''}</p>
        <FieldLabel>Own or lease?</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <TierButton selected={form.carType === 'own'} label="Own" sub="Purchase/finance — lower monthly once paid off" onClick={() => handleTierClick('carType', 'own')} />
          <TierButton selected={form.carType === 'lease'} label="Lease" sub="Higher monthly — always driving something new" onClick={() => handleTierClick('carType', 'lease')} />
        </div>
        <Note>All tiers include <strong>fuel, insurance, maintenance, and {form.carType === 'own' ? 'loan payment (if any)' : 'lease payment'}</strong> in one number.</Note>
        <TierGrid tiersObj={getCarTiers()} selectedKey={form.carTier} onSelect={(k) => handleTierClick('carTier', k)} cols={3} mult={1.0} />
        <FieldLabel>Monthly transportation budget (all-in){hasSpouse ? ' — your vehicle' : ''}</FieldLabel>
        <DollarInput value={form.carAmt} onChange={(v) => setField('carAmt', v)} />
        <Hint>Includes {form.carType === 'own' ? 'payment/loan' : 'lease payment'}, insurance, fuel, maintenance, and occasional rideshare</Hint>
      </>
    );
  }

  function renderStep5() {
    const mults = getMultipliers(form.retireState, form.retireCity);
    return (
      <>
        <Pill text="Food & Dining" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>How do you like to eat?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 20px', lineHeight: 1.75 }}>Groceries, restaurants, coffee, and takeout.{hasSpouse ? ' Spouse food (+50%) added in results.' : ''}</p>
        {form.retireState && <Note>Costs adjusted for <strong>{form.retireState}</strong> regional cost of living.</Note>}
        <TierGrid tiersObj={TIERS.food} selectedKey={form.foodTier} onSelect={(k) => handleTierClick('foodTier', k)} cols={2} mult={mults.general} />
        <FieldLabel>Monthly food & dining budget{hasSpouse ? ' — your share' : ''}</FieldLabel>
        <DollarInput value={form.foodAmt} onChange={(v) => setField('foodAmt', v)} />
      </>
    );
  }

  function renderStep6() {
    return (
      <>
        <Pill text="Healthcare" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Healthcare in retirement</h2>
        <Note>Default: <strong>$833/mo ($10,000/yr)</strong> — covers Medicare, supplements, dental, vision, prescriptions, and out-of-pocket.{hasSpouse ? ' Per-person — spouse healthcare (+100%) added automatically.' : ''} Adjust to fit your situation.</Note>
        <FieldLabel>Total Monthly Healthcare Budget{hasSpouse ? ' — per person' : ''}</FieldLabel>
        <DollarInput value={form.healthcareAmt} placeholder="833" onChange={(v) => setField('healthcareAmt', v)} />
        <Hint>All-in: Medicare premiums, supplement, dental, vision, prescriptions, and out-of-pocket · Default: $10,000/yr</Hint>
      </>
    );
  }

  function renderStep7() {
    const mults = getMultipliers(form.retireState, form.retireCity);
    return (
      <>
        <Pill text="Wellness" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 20px' }}>Staying healthy & well</h2>
        <div style={{ marginBottom: 26 }}>
          <FieldLabel badge={form.retireState || undefined}>Fitness & Exercise</FieldLabel>
          <TierGrid tiersObj={TIERS.fitness} selectedKey={form.fitnessTier} onSelect={(k) => handleTierClick('fitnessTier', k)} cols={2} mult={mults.general} />
          <DollarInput value={form.fitnessAmt} onChange={(v) => setField('fitnessAmt', v)} />
          {hasSpouse && <Hint>Spouse fitness (+75%) added automatically in results</Hint>}
        </div>
        <div>
          <FieldLabel>Therapy & Mental Health</FieldLabel>
          <TierGrid tiersObj={TIERS.therapy} selectedKey={form.therapyTier} onSelect={(k) => handleTierClick('therapyTier', k)} cols={3} mult={1.0} />
          <DollarInput value={form.therapyAmt} onChange={(v) => setField('therapyAmt', v)} />
          {hasSpouse && <Hint>Per-person — spouse therapy (+100%) added automatically</Hint>}
        </div>
      </>
    );
  }

  function renderStep8() {
    const mults = getMultipliers(form.retireState, form.retireCity);
    return (
      <>
        <Pill text="Lifestyle & Travel" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>How do you want to spend your time?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 20px', lineHeight: 1.75 }}>How you'll fill your free time — hobbies, entertainment, and travel.</p>
        {form.retireState && <Note>Entertainment costs adjusted for <strong>{form.retireState}</strong>. Travel is not location-adjusted.</Note>}
        <div style={{ marginBottom: 26 }}>
          <FieldLabel>Hobbies, Entertainment & Experiences</FieldLabel>
          <TierGrid tiersObj={TIERS.lifestyle} selectedKey={form.lifestyleTier} onSelect={(k) => handleTierClick('lifestyleTier', k)} cols={2} mult={mults.general} />
          <DollarInput value={form.lifestyleAmt} onChange={(v) => setField('lifestyleAmt', v)} />
        </div>
        <div>
          <FieldLabel>Travel & Vacation</FieldLabel>
          <TierGrid tiersObj={TIERS.vacation} selectedKey={form.vacationTier} onSelect={(k) => handleTierClick('vacationTier', k)} cols={3} mult={1.0} />
          <DollarInput value={form.vacationAmt} onChange={(v) => setField('vacationAmt', v)} />
          <Hint>Averaged monthly — e.g. $9,000/yr ÷ 12 = $750/mo</Hint>
        </div>
      </>
    );
  }

  function renderStep9() {
    return (
      <>
        <Pill text="Pets & Pet Care" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Do you have pets?</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 20px', lineHeight: 1.75 }}>Food, vet bills, grooming, insurance, and boarding add up. No pets? Select "No Pets" and move on.</p>
        <FieldLabel>Pet Care Level</FieldLabel>
        <TierGrid tiersObj={TIERS.pets} selectedKey={form.petsTier} onSelect={(k) => handleTierClick('petsTier', k)} cols={2} mult={1.0} />
        <FieldLabel>Monthly pet care budget</FieldLabel>
        <DollarInput value={form.petsAmt} onChange={(v) => setField('petsAmt', v)} />
        <Hint>Covers food, vet visits, insurance, grooming, boarding/pet-sitting, toys & supplies</Hint>
      </>
    );
  }

  function renderStep10() {
    const mults = getMultipliers(form.retireState, form.retireCity);
    return (
      <>
        <Pill text="Appearance & Personal Care" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Looking & feeling your best</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 20px', lineHeight: 1.75 }}>Clothing, haircuts, skincare, and grooming.{hasSpouse ? ' Per-person — spouse amounts added automatically.' : ''}</p>
        {form.retireState && <Note>Costs adjusted for <strong>{form.retireState}</strong> cost of living.</Note>}
        <div style={{ marginBottom: 26 }}>
          <FieldLabel>Clothing & Fashion</FieldLabel>
          <TierGrid tiersObj={TIERS.clothing} selectedKey={form.clothingTier} onSelect={(k) => handleTierClick('clothingTier', k)} cols={2} mult={mults.general} />
          <DollarInput value={form.clothingAmt} onChange={(v) => setField('clothingAmt', v)} />
          <Hint>Wardrobe updates, shoes, seasonal shopping, dry cleaning</Hint>
        </div>
        <div>
          <FieldLabel>Personal Care & Grooming</FieldLabel>
          <TierGrid tiersObj={TIERS.personalCare} selectedKey={form.personalCareTier} onSelect={(k) => handleTierClick('personalCareTier', k)} cols={2} mult={mults.general} />
          <DollarInput value={form.personalCareAmt} onChange={(v) => setField('personalCareAmt', v)} />
          <Hint>Haircuts, skincare, spa visits, grooming products, cosmetics</Hint>
        </div>
      </>
    );
  }

  function renderStep11() {
    return (
      <>
        <Pill text="Technology & Subscriptions" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 20px' }}>Tech, streaming & subscriptions</h2>
        <div style={{ marginBottom: 26 }}>
          <FieldLabel>Phone, Internet, Streaming & Software</FieldLabel>
          <TierGrid tiersObj={TIERS.streaming} selectedKey={form.streamTier} onSelect={(k) => handleTierClick('streamTier', k)} cols={2} mult={1.0} />
          <DollarInput value={form.streamAmt} onChange={(v) => setField('streamAmt', v)} />
          <Hint>Phone bill, home internet, streaming, software, cloud storage, device upgrades</Hint>
        </div>
        <div>
          <FieldLabel>Gifts (Birthdays, Holidays, Weddings)</FieldLabel>
          <TierGrid tiersObj={TIERS.gifts} selectedKey={form.giftsTier} onSelect={(k) => handleTierClick('giftsTier', k)} cols={3} mult={1.0} />
          <DollarInput value={form.giftsAmt} onChange={(v) => setField('giftsAmt', v)} />
        </div>
      </>
    );
  }

  function renderStep12() {
    return (
      <>
        <Pill text="Charitable Giving" />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Giving back</h2>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 22px', lineHeight: 1.75 }}>Calculated as a percentage of your gross income.</p>
        <FieldLabel>Charitable Giving</FieldLabel>
        <TierGrid tiersObj={TIERS.charity} selectedKey={form.charityTier} onSelect={(k) => handleTierClick('charityTier', k)} cols={4} mult={1.0} />
      </>
    );
  }

  function renderResults() {
    const r = calcResults(form);
    const cats = [
      { l: 'Housing', v: r.mo.housing }, { l: 'Home Care', v: r.mo.homeCare }, { l: 'Transportation', v: r.mo.car },
      { l: 'Food & Dining', v: r.mo.food }, { l: 'Healthcare', v: r.mo.healthcare }, { l: 'Fitness', v: r.mo.fitness },
      { l: 'Therapy', v: r.mo.therapy }, { l: 'Lifestyle', v: r.mo.lifestyle }, { l: 'Travel', v: r.mo.vacation },
      { l: 'Pets', v: r.mo.pets }, { l: 'Clothing', v: r.mo.clothing }, { l: 'Personal Care', v: r.mo.personalCare }, { l: 'Technology', v: r.mo.streaming },
      { l: 'Gifts', v: r.mo.gifts },
    ].filter((x) => x.v > 0).map((x, i) => ({ ...x, color: BAR_COLORS[i % BAR_COLORS.length] }));
    const totalMo = cats.reduce((s, x) => s + x.v, 0);
    const taxPct = r.gross > 0 ? ((r.fedTax + r.stateTax + r.cityTax) / r.gross * 100).toFixed(1) : '0.0';
    const heroItems = [
      { label: 'Gross / Month', val: fmt(r.gross / 12) },
      { label: 'Take-Home / Month', val: fmt(r.takeHome / 12) },
      { label: 'Total Tax Rate', val: `${taxPct}%` },
      { label: 'After-Tax / Year', val: fmt(r.takeHome) },
    ];
    const taxRows = [
      { label: `Federal Income Tax (${filing === 'mfj' ? 'MFJ' : 'Single'})`, val: r.fedTax, note: `${pct(r.fedTax, r.gross)} effective · 2026 brackets` },
      { label: `${form.retireState} State Tax`, val: r.stateTax, note: `${pct(r.stateTax, r.gross)} effective` },
      form.retireCity ? { label: `${form.retireCity} City Tax`, val: r.cityTax, note: `${pct(r.cityTax, r.gross)} effective` } : null,
      r.cPct > 0 ? { label: `Charitable Giving (${(r.cPct * 100).toFixed(0)}%)`, val: r.charity, note: 'Giving back' } : null,
      { label: 'Available for Living Expenses', val: r.takeHome, note: `${fmt(r.takeHome / 12)}/month`, bold: true, hi: true },
    ].filter(Boolean);

    return (
      <>
        <Pill text="Your Results" />
        <div style={{ background: `linear-gradient(135deg,${C.navyDk} 0%,${C.navy} 55%,${C.navyMd} 100%)`, borderRadius: 14, padding: '26px 28px', marginBottom: 22, boxShadow: '0 6px 24px rgba(20,31,82,.25)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>{form.name ? `${form.name}'s ${incomeLabel}` : incomeLabel}</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: C.white, letterSpacing: -2, lineHeight: 1 }}>{fmt(r.gross)}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 6 }}>gross annual · {householdLabel} · {form.retireCity || form.retireState}</div>
          <div style={{ display: 'flex', gap: 0, marginTop: 20, borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 18 }}>
            {heroItems.map((item, i) => (
              <div key={item.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.12)' : 'none', padding: '0 8px' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.gold }}>{item.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {form.household !== 'single' && (
          <Note>
            <strong>Household adjustments applied:</strong> Your individual selections have been scaled for a <strong>{householdLabel.toLowerCase()}</strong> household.
            {hasSpouse && ' Spouse adds: +60% transportation, +50% food/vacation, +100% healthcare/clothing/personal care/therapy, +75% fitness, +30% lifestyle/gifts, +25% tech.'}
            {numChildren > 0 && ` Each of ${numChildren} dependent(s) adds $300 food, $250 healthcare, $100 clothing, $50 personal care, $50 tech/mo.`}
            {' '}Filing: <strong>{filing === 'mfj' ? 'Married Filing Jointly' : 'Single'}</strong>.
          </Note>
        )}

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ background: C.navy, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.8)' }}>Tax & Obligations Breakdown</span>
          </div>
          {taxRows.map((row, i) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderTop: i > 0 ? `1px solid ${C.border}` : 'none', background: row.hi ? C.navyPale : C.white }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: row.bold ? 600 : 400, color: row.hi ? C.navy : C.ink }}>{row.label}</div>
                <div style={{ fontSize: 11, color: C.faint }}>{row.note}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: row.bold ? 700 : 500, color: row.hi ? C.navy : C.sub, whiteSpace: 'nowrap' }}>
                {fmt(row.val)}<span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>/yr</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ background: C.navy, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.8)' }}>Monthly Expense Breakdown{form.household !== 'single' ? ' (Household Total)' : ''}</span>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {cats.map((item) => {
              const p = totalMo > 0 ? (item.v / totalMo * 100) : 0;
              return (
                <div key={item.l} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 500, color: C.ink }}>{item.l}</span>
                    <span style={{ fontWeight: 600, color: item.color }}>{fmt(item.v)}<span style={{ fontWeight: 400, color: C.muted }}>/mo</span></span>
                  </div>
                  <div style={{ height: 7, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p}%`, background: item.color, borderRadius: 4, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: `2px solid ${C.navy}`, paddingTop: 12, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, color: C.navy }}>
              <span>Total Monthly Expenses</span><span>{fmt(totalMo)}/mo</span>
            </div>
          </div>
        </div>

        {r.stateTax === 0 && <Note type="green"><strong>{form.retireState}</strong> has no state income tax.</Note>}
        {form.retireCity && <Note type="amber"><strong>{form.retireCity}</strong> adds <strong>{fmt(r.cityTax)}/yr</strong> in city income tax.</Note>}

        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <button onClick={goBack} style={navBtnStyle}>← Back</button>
          <button onClick={startOver} style={navBtnStyle}>↺ Start Over</button>
        </div>
      </>
    );
  }

  const navBtnStyle = { background: 'transparent', border: `2px solid ${C.border}`, color: C.sub, borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9, renderStep10, renderStep11, renderStep12, renderResults];

  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.ink, minHeight: '100vh', width: '100%', margin: '-32px -32px 0', padding: '0 0 40px' }}>
      {/* Header / progress */}
      <div style={{ background: `linear-gradient(135deg,${C.navyDk} 0%,${C.navy} 55%,${C.navyMd} 100%)`, boxShadow: '0 3px 20px rgba(20,31,82,.3)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', marginBottom: 5 }}>UNIV 154 · Financial Literacy for Life</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: -0.3 }}>Retirement Income Planner</div>
            </div>
            <div style={{ textAlign: 'right', paddingTop: 2 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>Step {step + 1} of {STEP_NAMES.length}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>{STEP_NAMES[step]}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            {STEP_NAMES.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 3, background: i < step ? C.gold : i === step ? 'rgba(245,184,0,.6)' : 'rgba(255,255,255,.15)' }} />
                <div style={{ padding: '5px 2px 6px', fontSize: 8, fontWeight: i === step ? 700 : 400, color: i === step ? C.gold : i < step ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.3)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {i < step ? '✓' : i === step ? s.toUpperCase() : '·'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 760, margin: '28px auto 40px', padding: '0 16px' }}>
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 4px 28px rgba(28,45,110,.09)', overflow: 'hidden' }}>
          <div style={{ height: 5, background: `linear-gradient(90deg,${C.navyDk},${C.navyMd} 60%,${C.gold})` }} />
          <div style={{ padding: '34px 42px' }}>
            {stepRenderers[step]()}
            {step < RESULTS_STEP && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 34, paddingTop: 22, borderTop: `1px solid ${C.border}` }}>
                {step > 0 ? <button onClick={goBack} style={navBtnStyle}>← Back</button> : <div />}
                <button
                  onClick={goNext}
                  disabled={!canNext}
                  style={{
                    background: canNext ? `linear-gradient(135deg,${C.navyDk},${C.navyMd})` : C.border,
                    color: canNext ? C.white : C.faint,
                    border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 14, fontWeight: 700,
                    cursor: canNext ? 'pointer' : 'not-allowed',
                    boxShadow: canNext ? '0 4px 16px rgba(28,45,110,.28)' : 'none',
                  }}
                >
                  {step === LAST_INPUT ? 'See My Results →' : 'Continue →'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: C.faint }}>UNIV 154 · For educational planning purposes only · 2026 tax data via Tax Foundation</div>
      </div>
    </div>
  );
}
