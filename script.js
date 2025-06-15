const lanes = [
    document.querySelector(".lane-01"),
    document.querySelector(".lane-02"),
    document.querySelector(".lane-03"),
    document.querySelector(".lane-04")
];
const aligne = document.querySelector(".aligne");

let data;

fetch('./map.txt') 
    .then(response => response.text())
    .then(raw => {
        data = raw;  
		console.log(">> so we got the map file");
    })
    .catch(error => console.error(">> okay so there was an issue", error));

function ParseNotes(input) {
    const notes = [];
    const lines = input.trim().split("\n");

    lines.forEach(line => {
        const match = line.match(/note\((\d+),(\d+)\)/);
        if (match) {
            const time = parseInt(match[1], 10) - 400 ;
            const lane = parseInt(match[2], 10) - 1;
            notes.push({ time, lane});
        }
    });

    return JSON.stringify(notes, null, 4); // barbie-fy my json
}

let combo = 0;
const combocount = document.querySelector(".combo");

function UpdateCombo(hit) {
	combo++;
	if (hit == false) {
		combo = 0;
	}
	combocount.innerHTML = String(combo).padStart(3, "0");
}

let id = [0, 0, 0, 0];
let hit = [0, 0, 0, 0];

function GetTiming(note) {
    const spawnTime = parseFloat(note.dataset.spawnTime);
    const currentTime = performance.now();
	console.log(currentTime, spawnTime, currentTime-spawnTime-500);
    return currentTime - spawnTime - 550; // difference in ms
}

// creates judgement popups 
function CreateOffset(note) {
    const ms = Math.abs(GetTiming(note));
    const timing = document.createElement("div");
    timing.classList.add("timing", "timing-fade");
    timing.style.left = note.getBoundingClientRect().left + "px";
    timing.style.top = "80%";

	timing.style.setProperty("--rotates", (Math.floor(Math.random() * 21) - 10) + "deg")

    if (ms < 50) {
        timing.innerHTML = "PERFECT";
        timing.classList.add("note-perfect");
		UpdateCombo(true);
    } else if (ms < 100) {
        timing.innerHTML = "GREAT";
        timing.classList.add("note-great");
		UpdateCombo(true);
    } else if (ms < 150) {
        timing.innerHTML = "GOOD";
        timing.classList.add("note-good");
		UpdateCombo(true);
    } else {
        timing.innerHTML = "MISS";
        timing.classList.add("note-miss");
		UpdateCombo(false);
    }

    document.body.appendChild(timing);
    setTimeout(() => timing.remove(), 2000);
}
function GetDistance(note) {
    return aligne.getBoundingClientRect().top - note.getBoundingClientRect().top 
           - (parseInt(window.getComputedStyle(note).height) / 2);
}

// contrary to popular belief, this doesnt calculate colours
// instead it basically makes it so if the note is within 200ms of the judgement line, calculate it,
// otherwise leave it be
// yes i  know /**/ exists but im not going to use it
async function CalculateColor(laneIndex) {
    lanes[laneIndex].querySelectorAll(".note").forEach(note => {
        const noteColor = parseInt(note.dataset.id);
        const spawnTime = parseFloat(note.dataset.spawnTime);

        if (!spawnTime) return;

        const timingOffset = Math.abs(performance.now() - spawnTime);

        if (hit[laneIndex] === noteColor) {
            if (timingOffset < 750 && timingOffset > 350) {
                CreateOffset(note, timingOffset);
                note.remove();
            } else {
                hit[laneIndex] -= 1;
            }
        }
    });
}

/* i  lied */
function CreateNote(laneIndex) {
 const note = document.createElement("div");
    note.classList.add("note", "move-down");
    note.style.background = `hsl(${id[laneIndex] * 15}, 100%, 50%)`;
    note.dataset.id = id[laneIndex];
    note.dataset.spawnTime = performance.now();

    lanes[laneIndex].appendChild(note);
    id[laneIndex] += 1;

	// after 800ms, despawn the note
	setTimeout(() => {
		if (document.contains(note)) {
			CreateOffset(note, "MISS");
			note.remove();
			UpdateCombo(false);

			if (hit[laneIndex] < id[laneIndex]) { 
				hit[laneIndex] += 1;  // dont overshoot it now
			}
		}
	}, 800);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function NoteStuff(laneIndex) {
    console.log(laneIndex, hit[laneIndex], id[laneIndex]);

    if (hit[laneIndex] < id[laneIndex]) {
        CalculateColor(laneIndex); 
        hit[laneIndex] += 1;
    }
}

function PrintStuff(e) {
    if (e.key === "d") {
        NoteStuff(0); // Lane 1
    } else if (e.key === "f") {
        NoteStuff(1); // Lane 2
    } else if (e.key === "j") {
        NoteStuff(2); // Lane 3
    } else if (e.key === "k") {
        NoteStuff(3); // Lane 4
    }
}

async function Awesome() {
    let iter = 0;
    while (true) {
        CreateNote(iter % 4); // still spawning notes cyclically across lanes
        iter++;
        await wait(60000 / 200);
    }
}

document.addEventListener("click", () => {
	const notes = JSON.parse(ParseNotes(data));

	let audio = document.createElement("audio");
	audio.setAttribute("src", "/assets/audio.ogg");
	document.body.appendChild(audio);
	audio.play();

	notes.forEach(note => {
		setTimeout(() => CreateNote(note.lane, note.id), note.time);
	});
});

// im not even sure if this works
function RealignLanes() {
    lanes.forEach((lane, index) => {
        if (hit[index] > id[index]) {
            console.warn(`Realigning lane ${index}, hit=${hit[index]}, id=${id[index]}`);
            hit[index] = id[index];  // hard reset
        }
    });
}

console.log("loaded");

document.addEventListener("keydown", PrintStuff);

