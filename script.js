const GITHUB_OWNER = "h63v";
const GITHUB_REPO = "Hahaha";
const GITHUB_BRANCH = "main";
const MANGA_FOLDER = "manga";

const API_BASE =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

const RAW_BASE =
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

const worksContainer = document.getElementById("works");
const emptyMessage = document.getElementById("empty");
const countElement = document.getElementById("count");
const searchInput = document.getElementById("search");

const statusNames = {
    ongoing: "مستمر",
    completed: "مكتمل",
    paused: "متوقف"
};

let works = [];
let currentStatus = "all";
let currentSearch = "";


/* ==============================
   GitHub API
============================== */

async function getContents(path) {

    const url =
        `${API_BASE}/${path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`;

    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json"
        }
    });

    if (!response.ok) {
        throw new Error(
            `GitHub API Error: ${response.status}`
        );
    }

    return await response.json();
}


/* ==============================
   تحميل ملف HTML
============================== */

async function getHTML(path) {

    const url =
        `${RAW_BASE}/${path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `فشل تحميل ${path}`
        );
    }

    return await response.text();
}


/* ==============================
   قراءة Meta
============================== */

function getMeta(html, name) {

    const regex = new RegExp(
        `<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`,
        "i"
    );

    const match = html.match(regex);

    return match ? match[1].trim() : "";
}


/* ==============================
   عنوان العمل
============================== */

function getTitle(html, fallback) {

    const metaTitle =
        getMeta(html, "title");

    if (metaTitle) {
        return metaTitle;
    }

    const title =
        html.match(
            /<title[^>]*>(.*?)<\/title>/i
        );

    if (title) {
        return title[1]
            .replace(/\s*[-|—].*$/, "")
            .trim();
    }

    return fallback;
}


/* ==============================
   اكتشاف ملف العمل
============================== */

function findWorkFile(files) {

    return files.find(file => {

        if (file.type !== "file") {
            return false;
        }

        if (!file.name.endsWith(".html")) {
            return false;
        }

        return !/-chapter-\d+\.html$/i
            .test(file.name);
    });
}


/* ==============================
   تحميل عمل
============================== */

async function loadWork(folder) {

    const folderName = folder.name;

    const folderPath =
        `${MANGA_FOLDER}/${folderName}`;

    const files =
        await getContents(folderPath);


    const workFile =
        findWorkFile(files);


    if (!workFile) {

        console.warn(
            `لم يتم العثور على ملف العمل داخل: ${folderName}`
        );

        return null;
    }


    const workPath =
        `${folderPath}/${workFile.name}`;


    const html =
        await getHTML(workPath);


    /* معلومات العمل */

    const title =
        getTitle(
            html,
            folderName
        );


    const cover =
        getMeta(
            html,
            "cover"
        );


    const description =
        getMeta(
            html,
            "description"
        );


    const genres =
        getMeta(
            html,
            "genres"
        )
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);


    const status =
        getMeta(
            html,
            "status"
        ) || "ongoing";


    /* ==============================
       الفصول
    ============================== */

    const baseName =
        workFile.name
            .replace(
                /\.html$/i,
                ""
            );


    const chapterRegex =
        new RegExp(
            `^${escapeRegex(baseName)}-chapter-(\\d+)\\.html$`,
            "i"
        );


    const chapters =
        files
            .filter(file =>
                file.type === "file"
            )
            .map(file => {

                const match =
                    file.name.match(
                        chapterRegex
                    );

                if (!match) {
                    return null;
                }

                return {
                    number:
                        Number(match[1]),

                    name:
                        file.name,

                    url:
                        `${folderPath}/${file.name}`
                };

            })
            .filter(Boolean)
            .sort(
                (a, b) =>
                    b.number - a.number
            );


    return {

        title,

        folder:
            folderName,

        file:
            workPath,

        cover,

        description,

        genres,

        status,

        chapters

    };
}


/* ==============================
   Regex protection
============================== */

function escapeRegex(string) {

    return string.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


/* ==============================
   تحميل جميع الأعمال
============================== */

async function loadAllWorks() {

    try {

        worksContainer.innerHTML = `
            <div class="empty">
                جاري تحميل الأعمال...
            </div>
        `;


        const folders =
            await getContents(
                MANGA_FOLDER
            );


        const mangaFolders =
            folders.filter(
                item =>
                    item.type === "dir"
            );


        const loaded =
            await Promise.all(
                mangaFolders.map(
                    folder =>
                        loadWork(folder)
                )
            );


        works =
            loaded.filter(Boolean);


        render();


    } catch (error) {

        console.error(error);


        worksContainer.innerHTML = `
            <div class="empty">
                <h3>حدث خطأ أثناء تحميل الأعمال</h3>

                <p style="margin-top:12px">
                    تأكد من وجود مجلد
                    <strong>manga</strong>
                    داخل مستودع GitHub.
                </p>

                <p style="margin-top:8px">
                    Repository:
                    <strong>h63v/Hahaha</strong>
                </p>

                <p style="margin-top:8px">
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;

    }

}


/* ==============================
   Escape HTML
============================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[char]
        );
}


/* ==============================
   رابط الملف
============================== */

function getSiteURL(path) {

    return path
        .split("/")
        .map(
            encodeURIComponent
        )
        .join("/");
}


/* ==============================
   عرض الأعمال
============================== */

function render() {

    const search =
        currentSearch.toLowerCase();


    const filtered =
        works.filter(work => {

            const statusMatch =
                currentStatus === "all" ||
                work.status === currentStatus;


            const text =
                [
                    work.title,
                    work.description,
                    ...work.genres
                ]
                .join(" ")
                .toLowerCase();


            return (
                statusMatch &&
                text.includes(search)
            );

        });


    countElement.textContent =
        `${filtered.length} عمل`;


    worksContainer.innerHTML = "";


    if (filtered.length === 0) {

        emptyMessage.hidden = false;

        return;
    }


    emptyMessage.hidden = true;


    filtered.forEach(work => {

        const card =
            document.createElement(
                "article"
            );

        card.className = "work";


        const genres =
            work.genres
                .map(
                    genre =>
                        `<span class="genre">
                            ${escapeHTML(genre)}
                        </span>`
                )
                .join("");


        const workURL =
            getSiteURL(work.file);


        card.innerHTML = `

            <div class="cover">

                <img
                    src="${escapeHTML(work.cover)}"
                    alt="${escapeHTML(work.title)}"
                    loading="lazy"
                    onerror="this.src='https://placehold.co/600x850/15151e/8b5cf6?text=MangaX'"
                >

                <span class="status ${escapeHTML(work.status)}">
                    ${escapeHTML(
                        statusNames[work.status] ||
                        work.status
                    )}
                </span>

            </div>


            <div class="work-info">

                <h3>
                    ${escapeHTML(work.title)}
                </h3>


                <p class="description">
                    ${escapeHTML(
                        work.description
                    )}
                </p>


                <div class="genres">
                    ${genres}
                </div>


                <a
                    class="read"
                    href="${workURL}"
                >
                    عرض العمل
                </a>

            </div>

        `;


        worksContainer.appendChild(card);

    });

}


/* ==============================
   البحث
============================== */

searchInput.addEventListener(
    "input",
    event => {

        currentSearch =
            event.target.value
                .trim();

        render();

    }
);


/* ==============================
   الفلاتر
============================== */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(
                        btn =>
                            btn.classList
                                .remove("active")
                    );


                button.classList.add(
                    "active"
                );


                currentStatus =
                    button.dataset.status;


                render();

            }
        );

    });


/* ==============================
   تشغيل
============================== */

loadAllWorks();
