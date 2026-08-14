/* =========================================================
   MangaX - Dynamic Manga Loader
   GitHub + jsDelivr
   بدون index.json
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const OWNER = "h63v";
const REPO = "Hahaha";
const BRANCH = "main";

const ROOT = "manga";


/*
   jsDelivr

   يستخدم لاكتشاف الملفات وتحميل صفحات الأعمال.
*/

const JSDELIVR_FILES =
    `https://data.jsdelivr.com/v1/package/gh/${OWNER}/${REPO}@${BRANCH}/flat`;

const JSDELIVR_RAW =
    `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}`;


/*
   GitHub fallback
*/

const GITHUB_API =
    `https://api.github.com/repos/${OWNER}/${REPO}`;

const GITHUB_CONTENTS =
    `${GITHUB_API}/contents`;


/*
   Raw GitHub fallback
*/

const GITHUB_RAW =
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;


/* =========================================================
   DOM
========================================================= */

const worksEl =
    document.querySelector("#works");

const emptyEl =
    document.querySelector("#empty");

const countEl =
    document.querySelector("#count");

const searchEl =
    document.querySelector("#search");


/* =========================================================
   STATE
========================================================= */

let works = [];

let currentStatus = "all";

let searchQuery = "";


/* =========================================================
   STATUS
========================================================= */

const statusNames = {

    ongoing: "مستمر",

    completed: "مكتمل",

    paused: "متوقف",

    stopped: "متوقف"

};


/* =========================================================
   URL ENCODING
========================================================= */

function encodePath(path) {

    return path
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => {

                const map = {

                    "&": "&amp;",

                    "<": "&lt;",

                    ">": "&gt;",

                    '"': "&quot;",

                    "'": "&#039;"

                };

                return map[char];
            }
        );
}


/* =========================================================
   FETCH TEXT
========================================================= */

async function fetchText(url) {

    const response = await fetch(url, {

        cache: "no-store",

        headers: {

            "Accept": "text/html,text/plain,*/*"

        }

    });


    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );
    }


    return response.text();
}


/* =========================================================
   GET META
========================================================= */

function getMeta(html, name) {

    /*
       يقبل اختلاف ترتيب attributes
    */

    const regex =
        /<meta\b([^>]+)>/gi;

    let match;


    while (
        (match = regex.exec(html)) !== null
    ) {

        const attributes =
            match[1];


        const nameMatch =
            attributes.match(
                /\bname\s*=\s*["']([^"']+)["']/i
            );


        if (
            !nameMatch ||
            nameMatch[1].toLowerCase() !==
            name.toLowerCase()
        ) {

            continue;
        }


        const contentMatch =
            attributes.match(
                /\bcontent\s*=\s*["']([^"']*)["']/i
            );


        if (contentMatch) {

            return contentMatch[1].trim();
        }
    }


    return "";
}


/* =========================================================
   GET TITLE
========================================================= */

function getTitle(html) {

    const metaTitle =
        getMeta(html, "title");


    if (metaTitle) {

        return metaTitle
            .replace(/\s*\|\s*MangaX\s*$/i, "")
            .trim();
    }


    const titleMatch =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );


    if (titleMatch) {

        return titleMatch[1]
            .replace(/<[^>]+>/g, "")
            .replace(/\s*\|\s*MangaX\s*$/i, "")
            .trim();
    }


    const h1Match =
        html.match(
            /<h1[^>]*>([\s\S]*?)<\/h1>/i
        );


    if (h1Match) {

        return h1Match[1]
            .replace(/<[^>]+>/g, "")
            .trim();
    }


    return "";
}


/* =========================================================
   GET COVER
========================================================= */

function getCover(html) {

    /*
       الأفضل:

       <meta name="cover" content="URL">
    */

    const metaCover =
        getMeta(html, "cover");


    if (
        metaCover &&
        !isInvalidCover(metaCover)
    ) {

        return metaCover;
    }


    /*
       بعدها نحاول أخذ الصورة من .cover
    */

    const coverBlock =
        html.match(
            /<div[^>]*class\s*=\s*["'][^"']*\bcover\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
        );


    if (coverBlock) {

        const image =
            extractFirstImage(
                coverBlock[1]
            );


        if (
            image &&
            !isInvalidCover(image)
        ) {

            return image;
        }
    }


    /*
       بعدها أول صورة في الصفحة
    */

    const firstImage =
        extractFirstImage(html);


    if (
        firstImage &&
        !isInvalidCover(firstImage)
    ) {

        return firstImage;
    }


    return "";
}


/* =========================================================
   EXTRACT IMAGE
========================================================= */

function extractFirstImage(html) {

    const match =
        html.match(
            /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i
        );


    if (!match) {

        return "";
    }


    return match[1].trim();
}


/* =========================================================
   INVALID COVER
========================================================= */

function isInvalidCover(url) {

    if (!url) {

        return true;
    }


    const lower =
        url.toLowerCase();


    /*
       الصورة الافتراضية التي لا نريدها
    */

    if (
        lower.includes(
            "hentaislayer.net/images/user/no-image.jpg"
        )
    ) {

        return true;
    }


    if (
        lower.includes("no-image.jpg")
    ) {

        return true;
    }


    if (
        lower.includes("no-image.png")
    ) {

        return true;
    }


    if (
        lower.includes("placeholder")
    ) {

        return true;
    }


    return false;
}


/* =========================================================
   GET DESCRIPTION
========================================================= */

function getDescription(html) {

    const metaDescription =
        getMeta(
            html,
            "description"
        );


    if (metaDescription) {

        return metaDescription;
    }


    const match =
        html.match(
            /<p[^>]*class\s*=\s*["'][^"']*\bdescription\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i
        );


    if (match) {

        return match[1]
            .replace(/<[^>]+>/g, "")
            .trim();
    }


    return "لم تتم إضافة قصة بعد";
}


/* =========================================================
   GET GENRES
========================================================= */

function getGenres(html) {

    const metaGenres =
        getMeta(
            html,
            "genres"
        );


    if (metaGenres) {

        return metaGenres
            .split(",")
            .map(
                genre =>
                    genre.trim()
            )
            .filter(Boolean);
    }


    /*
       fallback من HTML
    */

    const block =
        html.match(
            /<div[^>]*class\s*=\s*["'][^"']*\bgenres\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
        );


    if (!block) {

        return [];
    }


    const genres = [];


    const regex =
        /<span[^>]*class\s*=\s*["'][^"']*\bgenre\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;


    let match;


    while (
        (match = regex.exec(block[1])) !== null
    ) {

        const genre =
            match[1]
                .replace(/<[^>]+>/g, "")
                .trim();


        if (genre) {

            genres.push(genre);
        }
    }


    return genres;
}


/* =========================================================
   GET STATUS
========================================================= */

function getStatus(html) {

    const metaStatus =
        getMeta(
            html,
            "status"
        );


    if (metaStatus) {

        return normalizeStatus(
            metaStatus
        );
    }


    const match =
        html.match(
            /class\s*=\s*["'][^"']*\bstatus\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i
        );


    if (match) {

        return normalizeStatus(
            match[1]
                .replace(/<[^>]+>/g, "")
                .trim()
        );
    }


    return "ongoing";
}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    const value =
        String(status)
            .trim()
            .toLowerCase();


    if (
        value === "ongoing" ||
        value === "مستمر"
    ) {

        return "ongoing";
    }


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
   GET FILE LIST FROM JSDELIVR
========================================================= */

async function getAllFiles() {

    try {

        const response =
            await fetch(
                JSDELIVR_FILES,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `jsDelivr HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        /*
           jsDelivr يرجع:

           {
               files: [
                   {
                       name: "manga/..."
                   }
               ]
           }
        */

        if (
            !data ||
            !Array.isArray(data.files)
        ) {

            throw new Error(
                "استجابة jsDelivr غير صحيحة"
            );
        }


        return data.files
            .map(file => file.name)
            .filter(Boolean);

    } catch (error) {

        console.warn(
            "jsDelivr failed:",
            error
        );


        /*
           fallback إلى GitHub API
        */

        try {

            const response =
                await fetch(
                    `${GITHUB_API}/git/trees/${BRANCH}?recursive=1`,
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `GitHub HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            if (
                !data.tree ||
                !Array.isArray(data.tree)
            ) {

                throw new Error(
                    "GitHub tree غير صحيح"
                );
            }


            return data.tree
                .filter(
                    file =>
                        file.type === "blob"
                )
                .map(
                    file =>
                        file.path
                );

        } catch (fallbackError) {

            console.error(
                "GitHub fallback failed:",
                fallbackError
            );


            throw new Error(
                "تعذر تحميل قائمة الأعمال حالياً."
            );
        }
    }
}


/* =========================================================
   GET HTML FROM CDN
========================================================= */

async function getWorkHTML(path) {

    /*
       أول محاولة:

       jsDelivr
    */

    try {

        const url =
            `${JSDELIVR_RAW}/${encodePath(path)}`;


        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (response.ok) {

            return response.text();
        }

    } catch (error) {

        console.warn(
            "CDN HTML failed:",
            error
        );
    }


    /*
       fallback:

       raw.githubusercontent
    */

    const rawURL =
        `${GITHUB_RAW}/${encodePath(path)}`;


    return fetchText(rawURL);
}


/* =========================================================
   BUILD WORK LIST FROM FILES
========================================================= */

function getWorkFolders(files) {

    const folders =
        new Set();


    files.forEach(path => {

        if (
            !path.startsWith(
                `${ROOT}/`
            )
        ) {

            return;
        }


        const relative =
            path.substring(
                ROOT.length + 1
            );


        const parts =
            relative.split("/");


        /*
           نحتاج فقط:

           manga/
             work-name/
               file.html
        */

        if (
            parts.length >= 2
        ) {

            folders.add(
                parts[0]
            );
        }
    });


    return [...folders];
}


/* =========================================================
   LOAD ONE WORK
========================================================= */

async function loadWork(
    folder,
    files
) {

    const folderPrefix =
        `${ROOT}/${folder}/`;


    /*
       ملفات HTML داخل مجلد العمل
    */

    const htmlFiles =
        files.filter(
            path =>
                path.startsWith(folderPrefix) &&
                /\.html$/i.test(path)
        );


    if (!htmlFiles.length) {

        return null;
    }


    /*
       ملف العمل الأساسي:

       moms-friends.html

       نستبعد:

       moms-friends-chapter-1.html
    */

    const workFile =
        htmlFiles.find(
            path => {

                const filename =
                    path.substring(
                        folderPrefix.length
                    );


                return (
                    !/-chapter-\d+\.html$/i.test(
                        filename
                    )
                );
            }
        );


    if (!workFile) {

        return null;
    }


    /*
       تحميل صفحة العمل
    */

    const page =
        await getWorkHTML(
            workFile
        );


    /*
       البيانات
    */

    const title =
        getTitle(page) ||
        folder;


    const cover =
        getCover(page);


    const description =
        getDescription(page);


    const genres =
        getGenres(page);


    const workStatus =
        getStatus(page);


    /*
       اسم الملف الأساسي

       moms-friends.html

       -> moms-friends
    */

    const workFilename =
        workFile
            .split("/")
            .pop();


    const baseName =
        workFilename
            .replace(
                /\.html$/i,
                ""
            );


    /*
       Regex للفصول
    */

    const escapedBase =
        baseName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );


    const chapterRegex =
        new RegExp(
            `^${escapedBase}-chapter-(\\d+)\\.html$`,
            "i"
        );


    /*
       اكتشاف الفصول
    */

    const chapters =
        htmlFiles
            .map(path => {

                const filename =
                    path.substring(
                        folderPrefix.length
                    );


                const match =
                    filename.match(
                        chapterRegex
                    );


                if (!match) {

                    return null;
                }


                return {

                    number:
                        Number(match[1]),

                    path

                };
            })
            .filter(Boolean)
            .sort(
                (a, b) =>
                    b.number - a.number
            );


    return {

        title,

        slug: folder,

        cover,

        description,

        genres,

        status: workStatus,

        file: workFile,

        chapters

    };
}


/* =========================================================
   LOAD ALL WORKS
========================================================= */

async function loadWorks() {

    const files =
        await getAllFiles();


    const folders =
        getWorkFolders(files);


    if (!folders.length) {

        return [];
    }


    const loaded =
        await Promise.all(
            folders.map(
                folder =>
                    loadWork(
                        folder,
                        files
                    )
            )
        );


    return loaded
        .filter(Boolean);
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!worksEl) {

        return;
    }


    const filtered =
        works.filter(
            work => {

                const matchesStatus =
                    currentStatus === "all" ||
                    work.status === currentStatus;


                const searchable =
                    [

                        work.title,

                        work.description,

                        ...work.genres

                    ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    searchable.includes(
                        searchQuery
                    );


                return (
                    matchesStatus &&
                    matchesSearch
                );
            }
        );


    /*
       العدد
    */

    if (countEl) {

        countEl.textContent =
            `${filtered.length} عمل`;
    }


    /*
       Empty
    */

    if (emptyEl) {

        emptyEl.hidden =
            filtered.length !== 0;
    }


    worksEl.innerHTML = "";


    /*
       الأعمال
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
               الغلاف
            */

            let coverHTML;


            if (
                work.cover &&
                !isInvalidCover(
                    work.cover
                )
            ) {

                coverHTML = `

                    <img
                        src="${escapeHTML(work.cover)}"
                        alt="${escapeHTML(work.title)}"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='https://placehold.co/600x850/15151e/8b5cf6?text=MangaX';
                        "
                    >

                `;

            } else {

                coverHTML = `

                    <div class="no-cover">

                        <span>
                            MangaX
                        </span>

                    </div>

                `;
            }


            /*
               التصنيفات
            */

            const genresHTML =
                work.genres
                    .map(
                        genre => `

                            <span class="genre">
                                ${escapeHTML(genre)}
                            </span>

                        `
                    )
                    .join("");


            /*
               البطاقة
            */

            card.innerHTML = `

                <div class="cover">

                    ${coverHTML}

                    <span class="status">

                        ${escapeHTML(
                            statusNames[
                                work.status
                            ] ||
                            work.status
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


                    <a
                        class="read"
                        href="/${encodePath(work.file)}"
                    >
                        عرض العمل
                    </a>

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
                event.target.value
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

                    document
                        .querySelectorAll(
                            ".filter"
                        )
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "active"
                                    )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentStatus =
                        button.dataset.status ||
                        "all";


                    render();
                }
            );
        }
    );


/* =========================================================
   START
========================================================= */

async function init() {

    try {

        /*
           رسالة مؤقتة
        */

        if (worksEl) {

            worksEl.innerHTML = `

                <div class="empty">

                    جاري تحميل الأعمال...

                </div>

            `;
        }


        works =
            await loadWorks();


        /*
           ترتيب الأعمال أبجدياً
        */

        works.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title,
                    "ar"
                )
        );


        render();


    } catch (error) {

        console.error(
            "MangaX:",
            error
        );


        if (worksEl) {

            worksEl.innerHTML = `

                <div class="empty">

                    تعذر تحميل الأعمال حالياً.

                    <br>

                    <small>
                        حاول تحديث الصفحة.
                    </small>

                </div>

            `;
        }
    }
}


/* =========================================================
   RUN
========================================================= */

init();
