/* =========================================================
   LIFO Parking Garage
   Data structure: Stack (Last In, First Out)
   - Arrival   -> push()  (car drives in and parks nearest the gate)
   - Departure -> pop()   (only the car nearest the gate can leave)
   ========================================================= */

const CAPACITY = 10;
const STORAGE_KEY = "lifo-parking-garage-v1";
const ANIMATION_MS = 800;

/* ---------- 1. The Stack ---------- */
class Stack {
  constructor(capacity) {
    this.items = [];          // items[0] = bottom (back of garage), last item = top (at the gate)
    this.capacity = capacity;
  }
  push(item) {
    if (this.isFull()) return false;
    this.items.push(item);
    return true;
  }
  pop() {
    return this.items.pop(); // undefined when empty
  }
  peek() {
    return this.items[this.items.length - 1];
  }
  contains(item) {
    return this.items.includes(item);
  }
  size()    { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
  isFull()  { return this.items.length === this.capacity; }
}

/* ---------- 2. State ---------- */
const garage = new Stack(CAPACITY);
// records[plate] = { arrivals: number, departures: number }
let records = {};
let busy = false; // true while a car is animating

/* ---------- 3. Page elements ---------- */
const lane = document.getElementById("lane");
const plateInput = document.getElementById("plate");
const actionInput = document.getElementById("action");
const goBtn = document.getElementById("go");
const resetBtn = document.getElementById("reset");
const messageEl = document.getElementById("message");
const resultEl = document.getElementById("result");
const stackListEl = document.getElementById("stackList");
const recordsEl = document.getElementById("records");
const barFill = document.getElementById("barFill");
const capacityText = document.getElementById("capacityText");

/* ---------- 4. Saving (survives page refresh) ---------- */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ stack: garage.items, records }));
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && Array.isArray(data.stack)) {
      garage.items = data.stack.slice(0, CAPACITY);
      records = data.records || {};
    }
  } catch (e) {
    // bad or missing data: start with an empty garage
  }
}

/* ---------- 5. Drawing ---------- */
function buildSlots() {
  for (let i = 0; i < CAPACITY; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.style.left = i * 10 + "%";
    slot.textContent = i + 1;
    lane.insertBefore(slot, lane.querySelector(".gate"));
  }
}

function slotLeft(index) {
  return index * 10 + 0.6 + "%";
}

// Gives each plate its own colour so cars are easy to tell apart
function hueFromPlate(plate) {
  let h = 0;
  for (const ch of plate) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function findCarEl(plate) {
  return [...lane.querySelectorAll(".car")].find((c) => c.dataset.plate === plate);
}

function createCarEl(plate) {
  const car = document.createElement("div");
  car.className = "car";
  car.dataset.plate = plate;
  car.style.setProperty("--hue", hueFromPlate(plate));
  const tag = document.createElement("span");
  tag.className = "plate";
  tag.textContent = plate;
  car.appendChild(tag);
  return car;
}

// Cars drive in from the right (off-screen) to their slot
function driveIn(plate, index) {
  const car = createCarEl(plate);
  car.style.left = "104%";
  lane.appendChild(car);
  void car.offsetWidth; // force the browser to register the start position
  car.style.left = slotLeft(index);
}

// Cars drive out to the right and are removed
function driveOut(plate) {
  const car = findCarEl(plate);
  if (!car) return;
  car.style.left = "104%";
  setTimeout(() => car.remove(), ANIMATION_MS);
}

// Draw every car without animation (used on page load)
function drawAllCars() {
  lane.querySelectorAll(".car").forEach((c) => c.remove());
  garage.items.forEach((plate, i) => {
    const car = createCarEl(plate);
    car.style.left = slotLeft(i);
    lane.appendChild(car);
  });
}

function refreshUI() {
  // highlight the top car
  lane.querySelectorAll(".car").forEach((c) => c.classList.remove("top-car"));
  if (!garage.isEmpty()) {
    const topEl = findCarEl(garage.peek());
    if (topEl) topEl.classList.add("top-car");
  }

  // capacity bar
  capacityText.textContent = `${garage.size()} / ${CAPACITY} cars`;
  barFill.style.width = (garage.size() / CAPACITY) * 100 + "%";
  barFill.classList.toggle("full", garage.isFull());

  // stack list (top first)
  stackListEl.innerHTML = "";
  if (garage.isEmpty()) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "The garage is empty.";
    stackListEl.appendChild(li);
  } else {
    [...garage.items].reverse().forEach((plate, i, arr) => {
      const li = document.createElement("li");
      li.textContent = plate + " ";
      if (i === 0) li.appendChild(tagSpan("top, leaves first"));
      if (i === arr.length - 1 && arr.length > 1) li.appendChild(tagSpan("bottom, arrived first"));
      stackListEl.appendChild(li);
    });
  }

  // records table
  recordsEl.innerHTML = "";
  const plates = Object.keys(records).sort();
  if (plates.length === 0) {
    recordsEl.innerHTML = '<tr><td colspan="4" class="out">No cars yet.</td></tr>';
  }
  plates.forEach((plate) => {
    const r = records[plate];
    const parked = garage.contains(plate);
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${plate}</td><td>${r.arrivals}</td><td>${r.departures}</td>` +
      `<td class="${parked ? "in" : "out"}">${parked ? "Parked" : "Left"}</td>`;
    recordsEl.appendChild(tr);
  });
}

function tagSpan(text) {
  const s = document.createElement("span");
  s.className = "tag";
  s.textContent = "(" + text + ")";
  return s;
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message " + type;
}

function showCounts(plate) {
  const r = records[plate];
  if (!r) {
    resultEl.hidden = true;
    return;
  }
  resultEl.hidden = false;
  resultEl.innerHTML =
    `<strong>${plate}</strong><br>` +
    `Arrived ${r.arrivals} ${r.arrivals === 1 ? "time" : "times"}, ` +
    `departed ${r.departures} ${r.departures === 1 ? "time" : "times"}.`;
}

/* ---------- 6. The two operations ---------- */
function arrive(plate) {
  if (garage.contains(plate)) {
    return fail(plate, `${plate} is already inside the garage.`);
  }
  if (garage.isFull()) {
    return fail(plate, `The garage is full (${CAPACITY} cars). ${plate} cannot enter.`);
  }

  garage.push(plate);                                  // PUSH
  if (!records[plate]) records[plate] = { arrivals: 0, departures: 0 };
  records[plate].arrivals++;

  driveIn(plate, garage.size() - 1);
  return succeed(plate, `${plate} entered and parked in slot ${garage.size()}.`);
}

function depart(plate) {
  if (!garage.contains(plate)) {
    return fail(plate, `${plate} is not in the garage.`);
  }
  if (garage.peek() !== plate) {
    // LIFO rule: only the top of the stack can leave
    return fail(
      plate,
      `${plate} is blocked. ${garage.peek()} is nearest the gate and must leave first.`
    );
  }

  garage.pop();                                        // POP
  records[plate].departures++;

  driveOut(plate);
  return succeed(plate, `${plate} left the garage.`);
}

function succeed(plate, text) {
  save();
  showMessage(text, "ok");
  showCounts(plate);
  setBusy(true);
  setTimeout(() => {
    refreshUI();
    setBusy(false);
    plateInput.focus();
  }, ANIMATION_MS);
  refreshUI(); // table and list update right away
}

function fail(plate, text) {
  showMessage(text, "error");
  showCounts(plate);
}

function setBusy(value) {
  busy = value;
  goBtn.disabled = value;
}

/* ---------- 7. Reading the input ---------- */
function submit() {
  if (busy) return;

  const plate = plateInput.value.trim().toUpperCase().replace(/\s+/g, " ");
  const action = actionInput.value.trim().toLowerCase();

  if (!/^[A-Z0-9 -]{2,10}$/.test(plate)) {
    return showMessage("Enter a plate number with 2 to 10 letters or digits.", "error");
  }
  if (action !== "a" && action !== "d") {
    return showMessage('Type "a" for arrival or "d" for departure.', "error");
  }

  if (action === "a") arrive(plate);
  else depart(plate);

  plateInput.value = "";
  actionInput.value = "";
}

function resetGarage() {
  if (busy) return;
  if (!confirm("Remove every car and clear all records?")) return;
  garage.items = [];
  records = {};
  save();
  drawAllCars();
  resultEl.hidden = true;
  showMessage("Garage reset.", "ok");
  refreshUI();
}

/* ---------- 8. Start ---------- */
goBtn.addEventListener("click", submit);
resetBtn.addEventListener("click", resetGarage);
[plateInput, actionInput].forEach((input) =>
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  })
);

buildSlots();
load();
drawAllCars();
refreshUI();
plateInput.focus();