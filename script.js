const INDEX_URL = "/manga/index.json";

const worksEl = document.querySelector("#works");
const emptyEl = document.querySelector("#empty");
const countEl = document.querySelector("#count");
const searchEl = document.querySelector("#search");

let works = [];
let currentStatus = "all";
let searchQuery = "";


/* =========================================================
   STATUS NAMES
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

    return (
        `/manga/` +
        `${encodeURIComponent(work.slug)}/` +
        `${encodeURIComponent(work.file)}`
    );
}


/* =========================================================
   CHAPTER URL
========================================================= */

function getChapterURL(
    work,
    number
) {

    return (
        `/manga/` +
        `${encodeURIComponent(work.slug)}/` +
        `${encodeURIComponent(
            work.slug +
            "-chapter-" +
            number +
            ".html"
        )}`
    );
}


/* =========================================================
   LOAD INDEX.JSON
========================================================= */

async function loadIndex() {

    const response = await fetch(
        `${INDEX_URL}?v=${Date.now()}`,
        {
            cache: "no-store"
        }
    );


    if (!response.ok) {

        throw new Error(
            `تعذر تحميل index.json (${response.status})`
        );
    }


    const data =
        await response.json();


    if (
        !data ||
        !Array.isArray(data.works)
    ) {

        throw new Error(
            "صيغة index.json غير صحيحة."
        );
    }


    return data.works;
}


/* =========================================================
   NORMALIZE WORK
========================================================= */

function normalizeWork(work) {

    const slug =
        String(
            work.slug || ""
        ).trim();


    const title =
        String(
            work.title ||
            slug ||
            "عمل بدون اسم"
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
   NORMALIZE CHAPTERS
========================================================= */

function normalizeChapters(work) {

    /*
        الحالة الأولى:

        "chapters": 27

        تصبح:

        [27, 26, 25 ... 1]
    */

    if (
        typeof work.chapters === "number"
    ) {

        const total =
            Math.max(
                0,
                Math.floor(
                    work.chapters
                )
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
        الحالة الثانية:

        "chapters": [1, 2, 3, 10, 20]

        أو:

        "chapters": [
            {"number": 1},
            {"number": 2}
        ]
    */

    if (
        Array.isArray(
            work.chapters
        )
    ) {

        const numbers =
            work.chapters
                .map(chapter => {

                    if (
                        typeof chapter ===
                        "object" &&
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
                .filter(
                    number =>
                        Number.isFinite(
                            number
                        ) &&
                        number > 0
                );


        /*
            إزالة التكرار
        */

        const unique =
            [...new Set(numbers)];


        /*
            ترتيب من الأكبر
            إلى الأصغر
        */

        unique.sort(
            (a, b) => b - a
        );


        return unique;
    }


    return [];
}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(status) {

    const value =
        String(
            status || ""
        )
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
   COVER
========================================================= */

function renderCover(work) {

    /*
        إذا ما عنده غلاف
    */

    if (!work.cover) {

        return `
            <div class="no-cover">
                <span>MangaX</span>
            </div>
        `;
    }


    /*
        إذا عنده غلاف
    */

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
   RENDER WORKS
========================================================= */

function render() {

    if (!worksEl) {
        return;
    }


    /*
        فلترة الأعمال
    */

    const filtered =
        works.filter(work => {

            const matchesStatus =
                currentStatus === "all" ||
                work.status ===
                currentStatus;


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


    /*
        عدد الأعمال
    */

    if (countEl) {

        countEl.textContent =
            `${filtered.length} عمل`;
    }


    /*
        حالة عدم وجود أعمال
    */

    if (emptyEl) {

        emptyEl.hidden =
            filtered.length !== 0;
    }


    worksEl.innerHTML = "";


    /*
        لا توجد نتائج
    */

    if (!filtered.length) {

        if (emptyEl) {
            emptyEl.hidden = false;
        }

        return;
    }


    /*
        إنشاء البطاقات
    */

    filtered.forEach(work => {

        const card =
            document.createElement(
                "article"
            );


        card.className = "work";


        /*
            التصنيفات
        */

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


        /*
            آخر فصل
        */

        const latestChapter =
            work.chapters.length
                ? work.chapters[0]
                : null;


        /*
            نص الفصل
        */

        const chapterText =
            latestChapter !== null
                ? `الفصل ${latestChapter}`
                : "لا توجد فصول";


        /*
            البطاقة
        */

        card.innerHTML = `

            <div class="cover">

                ${renderCover(work)}

                <span class="status">

                    ${escapeHTML(
                        statusNames[
                            work.status
                        ] ||
                        "مستمر"
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


        worksEl.appendChild(
            card
        );
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
                    event.target.value ||
                    ""
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

                /*
                    إزالة active
                    من جميع الأزرار
                */

                document
                    .querySelectorAll(
                        ".filter"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });


                /*
                    إضافة active
                    للزر الحالي
                */

                button.classList.add(
                    "active"
                );


                /*
                    تحديد الحالة
                */

                currentStatus =
                    button.dataset.status ||
                    "all";


                render();
            }
        );
    });


/* =========================================================
   AUTO REFRESH
========================================================= */

/*
    نعيد قراءة index.json
    كل 30 ثانية.

    هذا مفيد إذا أضفت عملًا جديدًا
    أو عدلت عدد الفصول في GitHub.

    بدون الحاجة إلى تحديث الصفحة يدويًا.
*/

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
                    .filter(
                        work =>
                            work.slug &&
                            work.file
                    );


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


        /*
            تحميل index.json
        */

        const data =
            await loadIndex();


        /*
            تحويل البيانات
            إلى صيغة موحدة
        */

        works =
            data
                .map(
                    normalizeWork
                )
                .filter(
                    work =>
                        work.slug &&
                        work.file
                );


        /*
            عرض الأعمال
        */

        render();


    } catch (error) {

        console.error(
            "MangaX:",
            error
        );


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
   START
========================================================= */

init();
