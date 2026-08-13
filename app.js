const API_URL = "http://127.0.0.1:8000/scan";

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const scanButton = document.getElementById("scanButton");
const statusLine = document.getElementById("statusLine");
const results = document.getElementById("results");

let selectedFile = null;

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    selectedFile = file;

    previewImage.src = URL.createObjectURL(file);
    previewImage.style.display = "block";

    document.getElementById("emptyState").style.display = "none";

    scanButton.disabled = false;

    statusLine.innerText = file.name;

});

scanButton.addEventListener("click", scanFood);

async function scanFood() {

    if (!selectedFile) return;

    statusLine.innerText = "Memindai...";

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": selectedFile.type
        },
        body: selectedFile
    });

    const data = await response.json();

    renderFoods(data.foods || []);

    statusLine.innerText = "Scan selesai";
}

function renderFoods(foods) {

    results.innerHTML = "";

    foods.forEach(food => {

        const card = document.createElement("div");

        card.className = "result-card";

        card.innerHTML = `
            <h3>${food.name}</h3>

            <p>${food.freshness}</p>

            <div class="metrics">

                <div class="metric">
                    Confidence<br>
                    <strong>${Math.round(food.confidence*100)}%</strong>
                </div>

                <div class="metric">
                    Shelf Life<br>
                    <strong>${food.shelf_life}</strong>
                </div>

                <div class="metric">
                    CNN Label<br>
                    <strong>${food.detected_label}</strong>
                </div>

            </div>
        `;

        results.appendChild(card);

        addHistory(food);

    });

}

function addHistory(food){

    const table = document.getElementById("historyTable");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${new Date().toLocaleDateString()}</td>
        <td>${food.name}</td>
        <td>${food.freshness}</td>
    `;

    table.prepend(row);
}

const ctx = document.getElementById("scanChart");

new Chart(ctx,{

type:"line",

data:{
labels:["Sen","Sel","Rab","Kam","Jum","Sab","Min"],

datasets:[{
label:"Jumlah Scan",
data:[5,7,4,8,12,10,14],
tension:.4
}]
}

});

function sendMessage(){

    const input = document.getElementById("chatInput");

    if(input.value.trim()==="") return;

    const chatBox = document.getElementById("chatBox");

    chatBox.innerHTML += `
      <div class="message user">
        ${input.value}
      </div>
    `;

    chatBox.innerHTML += `
      <div class="message ai">
        AI sedang menganalisis pertanyaan tentang makanan.
      </div>
    `;

    input.value="";

    chatBox.scrollTop = chatBox.scrollHeight;
}

const chartCanvas = document.getElementById("scanChart");

if(chartCanvas){

new Chart(chartCanvas,{

type:"line",

data:{
labels:["Sen","Sel","Rab","Kam","Jum","Sab","Min"],

datasets:[{
label:"Jumlah Scan",
data:[10,14,7,18,11,25,20],
borderWidth:3,
fill:false
}]
}

});

}