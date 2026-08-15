const INDEX_URL = "/manga/index.json";

const worksEl = document.querySelector("#works");
const emptyEl = document.querySelector("#empty");
const countEl = document.querySelector("#count");
const searchEl = document.querySelector("#search");

let works = [];
let currentStatus = "all";
let searchQuery = "";


/* =========================================================
   STATUS
========================================================= */

const statusNames = {
    ongoing: "مستمر",
    completed: "مكتمل",
    paused: "متوقف"
};


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char]));
}


/*
 * ترميز المسار بطريقة صحيحة
 * وتدعم العربي
 */

function encodePath(value) {

    return String(value ?? "")
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");
}


/* =========================================================
   WORK URL
========================================================= */

function getWorkURL(work) {

    if (!work || !work.slug || !work.file) {
        return "#";
    }

    return (
        "/manga/" +
        encodeURIComponent(work.slug) +
        "/" +
        encodeURIComponent(work.file)
    );
}


/* =========================================================
   CHAPTER URL
========================================================= */

function getChapterURL(work, number) {

    if (
        !work ||
        !work.slug ||
        !Number.isFinite(Number(number))
    ) {
        return "#";
    }


    const chapterFile =
        `${work.slug}-chapter-${number}.html`;


    return (
        "/manga/" +
        encodeURIComponent(work.slug) +
        "/" +
        encodeURIComponent(chapterFile)
    );
}


/* =========================================================
   LOAD INDEX
========================================================= */

async function loadIndex() {

    const url =
        `${INDEX_URL}?v=${Date.now()}`;


    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `تعذر تحميل index.json - HTTP ${response.status}`
        );
    }


    const text =
        await response.text();


    if (!text.trim()) {

        throw new Error(
            "index.json فارغ"
        );
    }


    let data;


    try {

        data =
            JSON.parse(text);

    } catch (error) {

        console.error(
            "index.json ليس JSON صالحًا:",
            text
        );

        throw new Error(
            "index.json يحتوي على خطأ في JSON"
        );
    }


    if (
        !data ||
        !Array.isArray(data.works)
    ) {

        throw new Error(
            "index.json يجب أن يحتوي على works"
        );
    }


    return data.works;
}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    const value =
        String(status ?? "")
            .trim()
            .toLowerCase();


    if (
        value === "completed" ||
        value === "complete" ||
        value === "مكتمل"
    ) {

        return "completed";
    }


    if (
        value === "paused" ||
        value === "stopped" ||
        value === "متوقف"
    ) {

        return "paused";
    }


    return "ongoing";
}


/* =========================================================
   NORMALIZE CHAPTERS
========================================================= */

function normalizeChapters(work) {

    if (!work) {
        return [];
    }


    /*
     * إذا كان:
     *
     * "chapters": 310
     */

    if (
        typeof work.chapters === "number" &&
        Number.isFinite(work.chapters)
    ) {

        const total =
            Math.max(
                0,
                Math.floor(work.chapters)
            );


        return Array.from(
            {
                length: total
            },
            (_, index) =>
                total - index
        );
    }


    /*
     * إذا كان chapters مصفوفة
     */

    if (
        Array.isArray(work.chapters)
    ) {

        const numbers =
            work.chapters
                .map(chapter => {

                    if (
                        typeof chapter === "object" &&
                        chapter !== null
                    ) {

                        return Number(
                            chapter.number
                        );
                    }


                    return Number(
                        chapter
                    );
                })
                .filter(number =>
                    Number.isFinite(number) &&
                    number > 0
                );


        return [
            ...new Set(numbers)
        ].sort(
            (a, b) => b - a
        );
    }


    return [];
}


/* =========================================================
   NORMALIZE WORK
========================================================= */

function normalizeWork(work) {

    if (
        !work ||
        typeof work !== "object"
    ) {

        return null;
    }


    const slug =
        String(
            work.slug ?? ""
        ).trim();


    if (!slug) {
        return null;
    }


    const title =
        String(
            work.title ||
            slug
        ).trim();


    const file =
        String(
            work.file ||
            `${slug}.html`
        ).trim();


    const cover =
        String(
            work.cover || ""
        ).trim();


    const description =
        String(
            work.description ||
            "لم تتم إضافة قصة بعد"
        ).trim();


    const genres =
        Array.isArray(work.genres)
            ? work.genres
                .map(
                    genre =>
                        String(
                            genre
                        ).trim()
                )
                .filter(Boolean)
            : [];


    return {

        slug,

        title,

        file,

        cover,

        description,

        genres,

        status:
            normalizeStatus(
                work.status
            ),

        chapters:
            normalizeChapters(
                work
            )
    };
}


/* =========================================================
   COVER
========================================================= */

function renderCover(work) {

    if (!work.cover) {

        return `
            <div class="no-cover">
                <span>MangaX</span>
            </div>
        `;
    }


    return `
        <img
            src="${escapeHTML(work.cover)}"
            alt="${escapeHTML(work.title)}"
            loading="lazy"
            onerror="
                this.onerror=null;
                this.parentElement.innerHTML =
                '<div class=&quot;no-cover&quot;><span>MangaX</span></div>';
            "
        >
    `;
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!worksEl) {

        console.error(
            "MangaX: العنصر #works غير موجود في HTML"
        );

        return;
    }


    const filtered =
        works.filter(work => {

            const matchesStatus =
                currentStatus === "all" ||
                work.status === currentStatus;


            const searchText =
                [
                    work.title,
                    work.description,
                    work.slug,
                    ...work.genres
                ]
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                searchText.includes(
                    searchQuery
                );


            return (
                matchesStatus &&
                matchesSearch
            );
        });


    if (countEl) {

        countEl.textContent =
            `${filtered.length} عمل`;
    }


    if (emptyEl) {

        emptyEl.hidden =
            filtered.length !== 0;
    }


    worksEl.innerHTML = "";


    if (!filtered.length) {

        if (emptyEl) {
            emptyEl.hidden = false;
        }

        return;
    }


    filtered.forEach(work => {

        const card =
            document.createElement(
                "article"
            );


        card.className = "work";


        const genresHTML =
            work.genres
                .map(
                    genre => `
                        <span class="genre">
                            ${escapeHTML(
                                genre
                            )}
                        </span>
                    `
                )
                .join("");


        const latestChapter =
            work.chapters.length > 0
                ? work.chapters[0]
                : null;


        const chapterText =
            latestChapter !== null
                ? `الفصل ${latestChapter}`
                : "لا توجد فصول";


        card.innerHTML = `

            <div class="cover">

                ${renderCover(work)}

                <span class="status">

                    ${escapeHTML(
                        statusNames[
                            work.status
                        ] || "مستمر"
                    )}

                </span>

            </div>


            <div class="work-info">

                <h3>
                    ${escapeHTML(
                        work.title
                    )}
                </h3>


                <p class="description">

                    ${escapeHTML(
                        work.description
                    )}

                </p>


                <div class="genres">

                    ${genresHTML}

                </div>


                <div class="work-actions">

                    <a
                        class="read"
                        href="${getWorkURL(work)}"
                    >
                        عرض العمل
                    </a>


                    ${
                        latestChapter !== null
                            ? `
                                <a
                                    class="latest"
                                    href="${getChapterURL(
                                        work,
                                        latestChapter
                                    )}"
                                >
                                    ${escapeHTML(
                                        chapterText
                                    )}
                                </a>
                              `
                            : ""
                    }

                </div>

            </div>

        `;


        worksEl.appendChild(card);

    });
}


/* =========================================================
   SEARCH
========================================================= */

if (searchEl) {

    searchEl.addEventListener(
        "input",
        event => {

            searchQuery =
                String(
                    event.target.value || ""
                )
                .toLowerCase()
                .trim();


            render();

        }
    );
}


/* =========================================================
   FILTERS
========================================================= */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                currentStatus =
                    button.dataset.status ||
                    "all";


                render();

            }
        );

    });


/* =========================================================
   INIT
========================================================= */

async function init() {

    try {

        if (worksEl) {

            worksEl.innerHTML = `

                <div class="empty">

                    جاري تحميل الأعمال...

                </div>

            `;
        }


        const data =
            await loadIndex();


        works =
            data
                .map(
                    normalizeWork
                )
                .filter(Boolean);


        console.log(
            "MangaX works:",
            works
        );


        render();


    } catch (error) {

        console.error(
            "MangaX ERROR:",
            error
        );


        if (countEl) {
            countEl.textContent = "خطأ";
        }


        if (worksEl) {

            worksEl.innerHTML = `

                <div class="empty">

                    ❌ تعذر تحميل الأعمال

                    <br><br>

                    <small>
                        ${escapeHTML(
                            error.message
                        )}
                    </small>

                </div>

            `;
        }

    }
}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    async () => {

        try {

            const data =
                await loadIndex();


            works =
                data
                    .map(
                        normalizeWork
                    )
                    .filter(Boolean);


            render();

        } catch (error) {

            console.error(
                "MangaX auto refresh:",
                error
            );

        }

    },
    30000
);


/* =========================================================
   START
========================================================= */

init();
