// =========================
// KANBAN BOARD
// =========================

const STORAGE_KEY = "kanban-board-data";

let board = {
    backlog: [],
    todo: [],
    inprogress: [],
    done: []
};

let currentColumn = "";
let draggedCardId = null;
let draggedFromColumn = null;
let activePriority = "All";
let searchText = "";
let selectedCard = null;

// =========================
// DOM ELEMENTS
// =========================

const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

const modal = document.getElementById("cardModal");
const titleInput = document.getElementById("cardTitle");
const descriptionInput = document.getElementById("cardDescription");
const priorityInput = document.getElementById("cardPriority");

const saveCardBtn = document.getElementById("saveCardBtn");
const cancelCardBtn = document.getElementById("cancelCardBtn");

const contextMenu = document.getElementById("contextMenu");
const moveNextBtn = document.getElementById("moveNextBtn");
const deleteCardBtn = document.getElementById("deleteCardBtn");

// =========================
// LOCAL STORAGE
// =========================

function saveBoard() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(board)
    );
}

function loadBoard() {
    const data = localStorage.getItem(STORAGE_KEY);

    if (data) {
        board = JSON.parse(data);
    }
}

// =========================
// UTILITIES
// =========================

function generateId() {
    return crypto.randomUUID();
}

function getCard(columnId, cardId) {
    return board[columnId].find(
        card => card.id === cardId
    );
}

function removeCard(columnId, cardId) {
    board[columnId] = board[columnId].filter(
        card => card.id !== cardId
    );
}

function updateCounts() {

    document.getElementById("count-backlog").textContent =
        board.backlog.length;

    document.getElementById("count-todo").textContent =
        board.todo.length;

    document.getElementById("count-inprogress").textContent =
        board.inprogress.length;

    document.getElementById("count-done").textContent =
        board.done.length;
}

// =========================
// MODAL
// =========================

document.querySelectorAll(".add-card-btn")
.forEach(btn => {

    btn.addEventListener("click", () => {

        currentColumn = btn.dataset.column;

        titleInput.value = "";
        descriptionInput.value = "";
        priorityInput.value = "P1";

        modal.classList.remove("hidden");
    });

});

cancelCardBtn.addEventListener("click", () => {

    modal.classList.add("hidden");
});

saveCardBtn.addEventListener("click", () => {

    const title = titleInput.value.trim();

    if (!title) {
        alert("Title is required");
        return;
    }

    const card = {
        id: generateId(),
        title,
        description: descriptionInput.value.trim(),
        priority: priorityInput.value,
        createdAt: Date.now()
    };

    board[currentColumn].push(card);

    saveBoard();
    renderBoard();

    modal.classList.add("hidden");
});

// =========================
// SEARCH
// =========================

searchInput.addEventListener("input", e => {

    searchText = e.target.value.toLowerCase();

    renderBoard();
});

// =========================
// FILTERS
// =========================

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        activePriority =
            button.dataset.priority;

        renderBoard();
    });

});

// =========================
// PRIORITY HELPERS
// =========================

function getPriorityClass(priority) {

    switch(priority){

        case "P1":
            return "p1";

        case "P2":
            return "p2";

        case "P3":
            return "p3";

        case "P4":
            return "p4";

        default:
            return "";
    }
}

function getBadgeClass(priority){

    switch(priority){

        case "P1":
            return "badge-p1";

        case "P2":
            return "badge-p2";

        case "P3":
            return "badge-p3";

        case "P4":
            return "badge-p4";

        default:
            return "";
    }
}
// =========================
// CREATE CARD ELEMENT
// =========================

function createCardElement(card, columnId){

    const cardEl = document.createElement("div");

    cardEl.className =
        `card ${getPriorityClass(card.priority)}`;

    cardEl.draggable = true;
    cardEl.dataset.id = card.id;
    cardEl.dataset.column = columnId;
    cardEl.tabIndex = 0;

    cardEl.innerHTML = `

        <div class="priority-badge
            ${getBadgeClass(card.priority)}">
            ${card.priority}
        </div>

        <div class="card-title">
            ${card.title}
        </div>

        <div class="card-description">
            ${card.description}
        </div>

        <select class="priority-select">
            <option value="P1"
                ${card.priority==="P1"?"selected":""}>
                P1
            </option>

            <option value="P2"
                ${card.priority==="P2"?"selected":""}>
                P2
            </option>

            <option value="P3"
                ${card.priority==="P3"?"selected":""}>
                P3
            </option>

            <option value="P4"
                ${card.priority==="P4"?"selected":""}>
                P4
            </option>
        </select>

        <button class="delete-btn">
            Delete
        </button>

    `;

    // =====================
    // INLINE EDIT TITLE
    // =====================

    const title =
        cardEl.querySelector(".card-title");

    title.addEventListener("dblclick", () => {

        const oldValue = title.textContent;

        title.contentEditable = true;
        title.focus();

        title.addEventListener("keydown", function(e){

            if(e.key === "Enter"){

                e.preventDefault();

                card.title =
                    title.textContent.trim();

                title.contentEditable = false;

                saveBoard();
                renderBoard();
            }

            if(e.key === "Escape"){

                title.textContent = oldValue;

                title.contentEditable = false;
            }

        });

    });

    // =====================
    // INLINE EDIT DESCRIPTION
    // =====================

    const description =
        cardEl.querySelector(".card-description");

    description.addEventListener("dblclick", () => {

        const oldValue =
            description.textContent;

        description.contentEditable = true;

        description.focus();

        description.addEventListener(
            "keydown",
            function(e){

                if(e.key==="Enter"){

                    e.preventDefault();

                    card.description =
                        description.textContent.trim();

                    description.contentEditable =
                        false;

                    saveBoard();
                    renderBoard();
                }

                if(e.key==="Escape"){

                    description.textContent =
                        oldValue;

                    description.contentEditable =
                        false;
                }

            }
        );

    });

    // =====================
    // PRIORITY CHANGE
    // =====================

    const prioritySelect =
        cardEl.querySelector(".priority-select");

    prioritySelect.addEventListener(
        "change",
        () => {

            card.priority =
                prioritySelect.value;

            saveBoard();
            renderBoard();
        }
    );

    // =====================
    // DELETE CARD
    // =====================

    const deleteBtn =
        cardEl.querySelector(".delete-btn");

    deleteBtn.addEventListener("click", () => {

        if(confirm("Delete this card?")){

            removeCard(columnId, card.id);

            saveBoard();
            renderBoard();
        }

    });

    // =====================
    // DRAG START
    // =====================

    cardEl.addEventListener("dragstart", () => {

        draggedCardId = card.id;

        draggedFromColumn =
            columnId;

        cardEl.classList.add("dragging");

    });

    // =====================
    // DRAG END
    // =====================

    cardEl.addEventListener("dragend", () => {

        cardEl.classList.remove("dragging");

    });

    // =====================
    // KEYBOARD ACCESSIBILITY
    // =====================

    cardEl.addEventListener("keydown", e => {

        if(e.code === "Space"){

            e.preventDefault();

            selectedCard = {
                id: card.id,
                column: columnId
            };

            contextMenu.style.left =
                "50%";

            contextMenu.style.top =
                "50%";

            contextMenu.classList.remove(
                "hidden"
            );
        }

    });

    return cardEl;
}

// =========================
// RENDER BOARD
// =========================

function renderBoard(){

    const columns = [

        "backlog",
        "todo",
        "inprogress",
        "done"

    ];

    columns.forEach(columnId => {

        const container =
            document.getElementById(columnId);

        container.innerHTML = "";

        let cards = [...board[columnId]];

        if(activePriority !== "All"){

            cards = cards.filter(
                card =>
                    card.priority ===
                    activePriority
            );
        }

        cards.forEach(card => {

            const cardEl =
                createCardElement(
                    card,
                    columnId
                );

            if(searchText){

                const match =

                    card.title
                    .toLowerCase()
                    .includes(searchText)

                    ||

                    card.description
                    .toLowerCase()
                    .includes(searchText);

                if(!match){

                    cardEl.classList.add(
                        "faded"
                    );
                }

            }

            container.appendChild(cardEl);

        });

    });

    updateCounts();
}
// =========================
// DRAG & DROP HELPERS
// =========================

function getDragAfterElement(container, y){

    const draggableElements = [

        ...container.querySelectorAll(
            ".card:not(.dragging)"
        )

    ];

    return draggableElements.reduce(

        (closest, child) => {

            const box =
                child.getBoundingClientRect();

            const offset =
                y - box.top - box.height / 2;

            if(
                offset < 0 &&
                offset > closest.offset
            ){

                return {
                    offset,
                    element: child
                };
            }

            return closest;

        },

        {
            offset: Number.NEGATIVE_INFINITY
        }

    ).element;

}

// =========================
// COLUMN DRAG EVENTS
// =========================

const columnContainers =

    document.querySelectorAll(".card-list");

columnContainers.forEach(container => {

    container.addEventListener(
        "dragover",
        e => {

            e.preventDefault();

            container.classList.add(
                "drag-over"
            );

        }
    );

    container.addEventListener(
        "dragleave",
        () => {

            container.classList.remove(
                "drag-over"
            );

        }
    );

    container.addEventListener(
        "drop",
        e => {

            e.preventDefault();

            container.classList.remove(
                "drag-over"
            );

            const targetColumn =
                container.id;

            if(
                !draggedCardId ||
                !draggedFromColumn
            ){
                return;
            }

            const draggedCard =
                getCard(
                    draggedFromColumn,
                    draggedCardId
                );

            if(!draggedCard){
                return;
            }

            removeCard(
                draggedFromColumn,
                draggedCardId
            );

            const afterElement =
                getDragAfterElement(
                    container,
                    e.clientY
                );

            if(!afterElement){

                board[targetColumn]
                    .push(draggedCard);

            }else{

                const afterId =
                    afterElement.dataset.id;

                const insertIndex =
                    board[targetColumn]
                    .findIndex(
                        card =>
                        card.id === afterId
                    );

                board[targetColumn]
                .splice(
                    insertIndex,
                    0,
                    draggedCard
                );

            }

            saveBoard();
            renderBoard();

            draggedCardId = null;
            draggedFromColumn = null;

        }
    );

});

// =========================
// CONTEXT MENU
// =========================

moveNextBtn.addEventListener(
    "click",
    () => {

        if(!selectedCard){
            return;
        }

        const order = [

            "backlog",
            "todo",
            "inprogress",
            "done"

        ];

        const currentIndex =
            order.indexOf(
                selectedCard.column
            );

        if(
            currentIndex ===
            order.length - 1
        ){

            contextMenu.classList.add(
                "hidden"
            );

            return;
        }

        const nextColumn =
            order[currentIndex + 1];

        const card =
            getCard(
                selectedCard.column,
                selectedCard.id
            );

        if(!card){
            return;
        }

        removeCard(
            selectedCard.column,
            selectedCard.id
        );

        board[nextColumn]
            .push(card);

        saveBoard();
        renderBoard();

        contextMenu.classList.add(
            "hidden"
        );

    }
);

// =========================
// DELETE FROM MENU
// =========================

deleteCardBtn.addEventListener(
    "click",
    () => {

        if(!selectedCard){
            return;
        }

        removeCard(
            selectedCard.column,
            selectedCard.id
        );

        saveBoard();
        renderBoard();

        contextMenu.classList.add(
            "hidden"
        );

    }
);

// =========================
// HIDE MENU WHEN CLICKING
// =========================

document.addEventListener(
    "click",
    e => {

        if(
            !contextMenu.contains(
                e.target
            )
        ){

            contextMenu.classList.add(
                "hidden"
            );

        }

    }
);

// =========================
// SAMPLE DATA
// =========================

function createDemoData(){

    if(

        board.backlog.length === 0 &&
        board.todo.length === 0 &&
        board.inprogress.length === 0 &&
        board.done.length === 0

    ){

        board.backlog.push({

            id: generateId(),

            title:
                "Design Landing Page",

            description:
                "Create homepage layout",

            priority: "P1",

            createdAt:
                Date.now()

        });

        board.todo.push({

            id: generateId(),

            title:
                "Login Form",

            description:
                "Build login UI",

            priority: "P2",

            createdAt:
                Date.now()

        });

        board.inprogress.push({

            id: generateId(),

            title:
                "Weather API",

            description:
                "Fetch weather data",

            priority: "P3",

            createdAt:
                Date.now()

        });

        board.done.push({

            id: generateId(),

            title:
                "Project Setup",

            description:
                "Folder structure ready",

            priority: "P4",

            createdAt:
                Date.now()

        });

    }

}

loadBoard();

createDemoData();

renderBoard();

saveBoard();
