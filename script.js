const PASSWORD="198700";
const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const shiftOptions=["","M","N","M/N","OFF","Vacation","Sick Leave"];

let editingId=null;

function getStaff(){
    let staff=JSON.parse(localStorage.getItem("staffList"));
    if(!staff){
        staff=["user","user1","user2"];
        localStorage.setItem("staffList",JSON.stringify(staff));
    }
    return staff;
}

function renderTable(){
    const staff=getStaff();
    let table=document.getElementById("shiftTable");
    table.innerHTML="";

    let header="<tr><th>Staff</th>";
    days.forEach(d=>header+=`<th>${d}</th>`);
    header+="<th>Remove</th></tr>";
    table.innerHTML+=header;

    staff.forEach(name=>{
        let row=`<tr>
        <td class="editableName" onclick="editStaffName(this,'${name}')">${name}</td>`;

        days.forEach(day=>{
            row+=`<td>
            <select onchange="colorShift(this)">
            ${shiftOptions.map(s=>`<option>${s}</option>`).join("")}
            </select>
            </td>`;
        });

        row+=`<td><button class="smallBtn" onclick="removeStaff('${name}')">X</button></td></tr>`;
        table.innerHTML+=row;
    });
}

/* edit staff name */
function editStaffName(cell, oldName){
    let pass=prompt("Enter password:");
    if(pass!==PASSWORD) return alert("Wrong password");

    let newName=prompt("Edit Staff Name:", oldName);
    if(!newName || newName.trim()==="") return;

    let staff=getStaff();
    let index=staff.indexOf(oldName);
    if(index>-1){
        staff[index]=newName.trim();
        localStorage.setItem("staffList",JSON.stringify(staff));
    }

    cell.innerText=newName.trim();
}

/* shift color logic */
function colorShift(select){
    // remove all previous shift classes
    select.classList.remove("M","N","OFF","MN","VAC","SICK");

    switch(select.value){
        case "M": select.classList.add("M"); break;
        case "N": select.classList.add("N"); break;
        case "OFF": select.classList.add("OFF"); break;
        case "M/N": select.classList.add("MN"); break;
        case "Vacation": select.classList.add("VAC"); break;
        case "Sick Leave": select.classList.add("SICK"); break;
    }
}

/* add new staff */
function addStaff(){
    let pass=prompt("Enter password:");
    if(pass!==PASSWORD) return alert("Wrong password");

    let name=document.getElementById("newStaff").value.trim();
    if(!name) return;

    let staff=getStaff();
    staff.push(name);
    localStorage.setItem("staffList",JSON.stringify(staff));
    document.getElementById("newStaff").value="";
    renderTable();
}

/* remove staff */
function removeStaff(name){
    let pass=prompt("Enter password:");
    if(pass!==PASSWORD) return alert("Wrong password");

    let staff=getStaff().filter(s=>s!==name);
    localStorage.setItem("staffList",JSON.stringify(staff));
    renderTable();
}

/* save schedule */
function saveSchedule(){
    let week=document.getElementById("weekDate").value;
    if(!week) return alert("Select week date");

    let table=document.getElementById("shiftTable");
    let rows=table.rows;
    let data={};

    for(let i=1;i<rows.length;i++){
        let name=rows[i].cells[0].innerText;
        data[name]={};
        for(let j=0;j<days.length;j++){
            let select = rows[i].cells[j+1].querySelector("select");
            data[name][days[j]]=select.value;
            colorShift(select); // update color in case it's edited
        }
    }

    let schedules=JSON.parse(localStorage.getItem("schedules"))||[];

    if(editingId){
        schedules=schedules.map(s=>s.id===editingId?{...s,week,data}:s);
        editingId=null;
    }else{
        schedules.push({
            id:Date.now(),
            week,
            created:new Date().toLocaleString(),
            data
        });
    }

    localStorage.setItem("schedules",JSON.stringify(schedules));
    renderSaved();
    alert("Saved Successfully");
}

/* render saved schedules */
function renderSaved(){
    let container=document.getElementById("savedContainer");
    container.innerHTML="";
    let schedules=JSON.parse(localStorage.getItem("schedules"))||[];

    schedules.forEach(s=>{
        let card=document.createElement("div");
        card.className="savedCard";

        let html=`<b>Week:</b> ${s.week} | <b>Created:</b> ${s.created}<br><br>`;
        html+=`<table><tr><th>Staff</th>${days.map(d=>`<th>${d}</th>`).join("")}</tr>`;

        for(let staff in s.data){
            html+=`<tr><td>${staff}</td>`;
            days.forEach(day=>{
                html+=`<td>${s.data[staff][day]}</td>`;
            });
            html+="</tr>";
        }

        html+="</table><br>";
        html+=`
        <button class="smallBtn" onclick="editSchedule(${s.id})">Edit</button>
        <button class="smallBtn" onclick="deleteSchedule(${s.id})">Delete</button>
        <button class="smallBtn" onclick="exportExcel(${s.id})">Export Excel</button>
        `;

        card.innerHTML=html;
        container.appendChild(card);
    });
}

/* edit schedule */
function editSchedule(id){
    let schedules=JSON.parse(localStorage.getItem("schedules"))||[];
    let s=schedules.find(x=>x.id===id);
    if(!s) return;

    editingId=id;
    document.getElementById("weekDate").value=s.week;
    renderTable();

    let rows=document.getElementById("shiftTable").rows;

    for(let i=1;i<rows.length;i++){
        let name=rows[i].cells[0].innerText;
        days.forEach((day,index)=>{
            let select = rows[i].cells[index+1].querySelector("select");
            select.value = s.data[name][day];
            colorShift(select); // apply proper color
        });
    }
}

/* delete schedule */
function deleteSchedule(id){
    let pass=prompt("Enter password:");
    if(pass!==PASSWORD) return alert("Wrong password");

    let schedules=JSON.parse(localStorage.getItem("schedules"))||[];
    schedules=schedules.filter(s=>s.id!==id);
    localStorage.setItem("schedules",JSON.stringify(schedules));
    renderSaved();
}

/* export excel */
function exportExcel(id){
    let schedules=JSON.parse(localStorage.getItem("schedules"))||[];
    let s=schedules.find(x=>x.id===id);

    let wsData=[["Staff",...days]];

    for(let staff in s.data){
        wsData.push([staff,...days.map(d=>s.data[staff][d])]);
    }

    let wb=XLSX.utils.book_new();
    let ws=XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb,ws,"Shifts");
    XLSX.writeFile(wb,`Shift_Week_${s.week}.xlsx`);
}

/* themes */
let themes=["ocean","light","neon"];
let currentThemeIndex=0;

function toggleTheme(){
    currentThemeIndex=(currentThemeIndex+1)%themes.length;
    let theme=themes[currentThemeIndex];

    document.body.classList.remove("theme-ocean","theme-light","theme-neon");
    document.body.classList.add("theme-"+theme);

    localStorage.setItem("selectedTheme",theme);
}

function loadTheme(){
    let savedTheme=localStorage.getItem("selectedTheme") || "ocean";
    currentThemeIndex=themes.indexOf(savedTheme);
    document.body.classList.add("theme-"+savedTheme);
}
loadTheme();

/* current week date */
function setCurrentWeek(){
    const today=new Date();
    const day=today.getDay(); // 0=Sun
    const diff=today.getDate() - day + (day===0?-6:1);
    const monday=new Date(today.setDate(diff));
    const iso=monday.toISOString().split("T")[0];
    document.getElementById("weekDate").value=iso;
}
setCurrentWeek();

/* reset staff */
function resetStaff(){
    let pass=prompt("Enter password:");
    if(pass!==PASSWORD) return alert("Wrong password");

    localStorage.removeItem("staffList");
    renderTable();
}

renderTable();
renderSaved();
function deleteAllSchedules(){
    let pass = prompt("Enter password to delete all schedules:");
    if(pass !== PASSWORD) return alert("Wrong password");

    if(confirm("Are you sure you want to delete ALL saved schedules?")) {
        localStorage.removeItem("schedules");
        renderSaved();
        alert("All saved schedules have been deleted!");
    }
}
