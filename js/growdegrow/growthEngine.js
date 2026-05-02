// ADD THESE BEFORE return

function getDaysInMonth(year, month){
  return new Date(year, month, 0).getDate();
}

const m0Year = Math.floor(m0/100);
const m0Month = m0%100;

const m1Year = Math.floor(m1/100);
const m1Month = m1%100;

const m2Year = Math.floor(m2/100);
const m2Month = m2%100;

const currentDays = [];
for(let i=1;i<=getDaysInMonth(m0Year, m0Month);i++) currentDays.push(i);

const prev1DaysArr = [];
for(let i=1;i<=getDaysInMonth(m1Year, m1Month);i++) prev1DaysArr.push(i);

const prev2DaysArr = [];
for(let i=1;i<=getDaysInMonth(m2Year, m2Month);i++) prev2DaysArr.push(i);