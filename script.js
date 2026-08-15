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


/*
    تشفير جزء من الرابط فقط.
    يدعم العربي مثل:

    فصل-سري
    فصل-سري-chapter-310.html
*/

function encodePart(value) {

    return encodeURIComponent(
        String(value ?? "")
    );
}


/* =========================================================
   WORK URL
========================================================= */

function getWorkURL(work) {

    const slug =
        String(
            work.slug || ""
        ).trim();

    const file =
        String(
            work.file ||
            `${slug}.html`
        ).trim();


    return (
        `/manga/` +
        `${encodePart(slug)}/` +
        `${encodePart(file)}`
    );
}


/* =========================================================
   CHAPTER URL
========================================================= */

function getChapterURL(
    work,
    number
) {

    const slug =
        String(
            work.slug || ""
        ).trim();


    const chapterNumber =
        String(number).trim();


    /*
        اسم ملف الفصل:

        فصل-سري-chapter-1.html

        فصل-سري-chapter-310.html
    */

    const filename =
        `${slug}-chapter-${chapterNumber}.html`;


    /*
        الرابط:

        /manga/فصل-سري/
        فصل-سري-chapter-310.html
    */

    return (
        `/manga/` +
        `${encodePart(slug)}/` +
        `${encodePart(filename)}`
    );
}


/* =========================================================
   LOAD INDEX.JSON
========================================================= */

async function loadIndex() {

    const response =
        await fetch(
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

    if (
        !work ||
        typeof work !== "object"
    ) {

        return null;
    }


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
        Array.isArray(
            work.genres
        )

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
        إذا كان:

        "chapters": 310

        يتم إنشاء:

        310
        309
        308
        ...
        1
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
        إذا كان chapters مصفوفة:

        [
            1,
            2,
            3,
            ...
            310
        ]
    */

    if (
        Array.isArray(
            work.chapters
        )
    ) {

        const numbers =
            work.chapters
                .map(
                    chapter => {

                        if (
                            typeof chapter ===
                                "object"
                            &&
                            chapter !== null
                        ) {

                            return Number(
                                chapter.number
                            );
                        }


                        return Number(
                            chapter
                        );
                    }
                )
                .filter(
                    number =>
                        Number.isFinite(
                            number
                        )
                        &&
                        number > 0
                );


        /*
            حذف التكرار
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
   RENDER WORKS
========================================================= */

function render() {

    if (!worksEl) {
        return;
    }


    /*
        فلترة الأعمال حسب الحالة والبحث
    */

    const filtered =
        works.filter(
            work => {

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
            }
        );


    /*
        عدد الأعمال
    */

    if (countEl) {

        countEl.textContent =
            `${filtered.length} عمل`;
    }


    /*
        إخفاء / إظهار رسالة عدم وجود نتائج
    */

    if (emptyEl) {

        emptyEl.hidden =
            filtered.length !== 0;
    }


    /*
        تنظيف القائمة
    */

    worksEl.innerHTML = "";


    /*
        لا توجد نتائج
    */

    if (!filtered.length) {

        return;
    }


    /*
        إنشاء بطاقة لكل عمل
    */

    filtered.forEach(
        work => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "work";


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
                أحدث فصل

                normalizeChapters
                يرتبها من الأكبر
                إلى الأصغر
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
                رابط صفحة العمل
            */

            const workURL =
                getWorkURL(work);


            /*
                رابط أحدث فصل
            */

            const latestChapterURL =
                latestChapter !== null
                    ? getChapterURL(
                        work,
                        latestChapter
                    )
                    : "";


            /*
                إنشاء البطاقة
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
                            href="${escapeHTML(
                                workURL
                            )}"
                        >
                            عرض العمل
                        </a>


                        ${
                            latestChapter !== null

                                ? `
                                    <a
                                        class="latest"
                                        href="${escapeHTML(
                                            latestChapterURL
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
        }
    );
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
    .forEach(
        button => {

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
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );
                            }
                        );


                    /*
                        تفعيل الزر الحالي
                    */

                    button.classList.add(
                        "active"
                    );


                    /*
                        الحالة الحالية
                    */

                    currentStatus =
                        button.dataset.status ||
                        "all";


                    render();
                }
            );
        }
    );


/* =========================================================
   REFRESH WORKS
========================================================= */

async function refreshWorks() {

    try {

        const data =
            await loadIndex();


        const newWorks =
            data
                .map(
                    normalizeWork
                )
                .filter(
                    work =>
                        work &&
                        work.slug &&
                        work.file
                );


        works =
            newWorks;


        render();


    } catch (error) {

        console.error(
            "MangaX refresh:",
            error
        );
    }
}


/* =========================================================
   AUTO REFRESH
========================================================= */

/*
    يفحص index.json كل 30 ثانية.

    إذا أضفت عملًا جديدًا إلى index.json
    سيظهر تلقائيًا بدون إعادة تحميل الصفحة.

    وإذا زاد عدد الفصول:
    سيتم تحديث أحدث فصل تلقائيًا أيضًا.
*/

setInterval(
    refreshWorks,
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

        await refreshWorks();


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
