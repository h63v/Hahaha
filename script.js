const OWNER = "h63v";
const REPO = "Hahaha";
const BRANCH = "main";
const ROOT = "manga";

const API =
    `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

const RAW =
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

const worksEl = document.querySelector("#works");
const empty = document.querySelector("#empty");
const count = document.querySelector("#count");
const search = document.querySelector("#search");

let works = [];
let status = "all";
let q = "";

const statusNames = {
    ongoing: "مستمر",
    completed: "مكتمل",
    paused: "متوقف"
};


/* =========================================================
   HELPERS
========================================================= */

const enc = path =>
    path
        .split("/")
        .map(encodeURIComponent)
        .join("/");


async function contents(path) {

    const response = await fetch(
        `${API}/${enc(path)}?ref=${BRANCH}`
    );

    if (!response.ok) {
        throw new Error(
            `GitHub API ${response.status}`
        );
    }

    return response.json();
}


async function html(path) {

    const response = await fetch(
        `${RAW}/${enc(path)}`
    );

    if (!response.ok) {
        throw new Error(
            `تعذر تحميل ${path}`
        );
    }

    return response.text();
}


/* =========================================================
   META
========================================================= */

function meta(htmlText, name) {

    const regex = new RegExp(
        `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`,
        "i"
    );

    const match = htmlText.match(regex);

    return match
        ? match[1].trim()
        : "";
}


/* =========================================================
   HTML TEXT
========================================================= */

function getTitle(htmlText) {

    const metaTitle = meta(
        htmlText,
        "title"
    );

    if (metaTitle) {
        return metaTitle;
    }


    const titleMatch = htmlText.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
    );

    if (titleMatch) {

        return titleMatch[1]
            .replace(/\s*\|\s*MangaX\s*$/i, "")
            .trim();
    }


    const h1Match = htmlText.match(
        /<h1[^>]*>([\s\S]*?)<\/h1>/i
    );

    if (h1Match) {

        return h1Match[1]
            .replace(/<[^>]+>/g, "")
            .trim();
    }

    return "";
}


function getCover(htmlText) {

    /* أولاً حاول meta cover */

    const metaCover = meta(
        htmlText,
        "cover"
    );

    if (metaCover) {
        return metaCover;
    }


    /* بعدها ابحث داخل .cover */

    const coverMatch = htmlText.match(
        /<div[^>]*class=["'][^"']*\bcover\b[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i
    );

    if (coverMatch) {
        return coverMatch[1].trim();
    }


    /* بعدها أي صورة */

    const imageMatch = htmlText.match(
        /<img[^>]+src=["']([^"']+)["']/i
    );

    if (imageMatch) {
        return imageMatch[1].trim();
    }


    return "";
}


function getDescription(htmlText) {

    const metaDescription = meta(
        htmlText,
        "description"
    );

    if (metaDescription) {
        return metaDescription;
    }


    const descriptionMatch = htmlText.match(
        /<p[^>]*class=["'][^"']*\bdescription\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i
    );

    if (descriptionMatch) {

        return descriptionMatch[1]
            .replace(/<[^>]+>/g, "")
            .trim();
    }


    return "";
}


function getGenres(htmlText) {

    const metaGenres = meta(
        htmlText,
        "genres"
    );

    if (metaGenres) {

        return metaGenres
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);
    }


    const genresMatch = htmlText.match(
        /<div[^>]*class=["'][^"']*\bgenres\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );

    if (!genresMatch) {
        return [];
    }


    const genres = [];

    const regex =
        /<span[^>]*class=["'][^"']*\bgenre\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;

    let match;

    while ((match = regex.exec(genresMatch[1]))) {

        const value = match[1]
            .replace(/<[^>]+>/g, "")
            .trim();

        if (value) {
            genres.push(value);
        }
    }

    return genres;
}


function getStatus(htmlText) {

    const metaStatus = meta(
        htmlText,
        "status"
    );

    if (metaStatus) {
        return metaStatus;
    }


    const statusMatch = htmlText.match(
        /<span[^>]*class=["'][^"']*\bstatus\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
    );

    if (statusMatch) {

        const value = statusMatch[1]
            .replace(/<[^>]+>/g, "")
            .trim();

        if (
            value === "مستمر" ||
            value.toLowerCase() === "ongoing"
        ) {
            return "ongoing";
        }

        if (
            value === "مكتمل" ||
            value.toLowerCase() === "completed"
        ) {
            return "completed";
        }

        if (
            value === "متوقف" ||
            value.toLowerCase() === "paused"
        ) {
            return "paused";
        }
    }


    return "ongoing";
}


/* =========================================================
   ESCAPE
========================================================= */

function esc(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char])
        );
}


/* =========================================================
   LOAD WORK
========================================================= */

async function load(folder) {

    const folderPath =
        `${ROOT}/${folder.name}`;


    const files =
        await contents(folderPath);


    /*
       نبحث عن ملف العمل الأساسي

       مثال:

       moms-friends.html

       وليس:

       moms-friends-chapter-1.html
    */

    const workFile = files.find(
        file =>
            file.type === "file" &&
            /\.html$/i.test(file.name) &&
            !/-chapter-\d+\.html$/i.test(file.name)
    );


    if (!workFile) {
        return null;
    }


    const workPath =
        `${folderPath}/${workFile.name}`;


    const page =
        await html(workPath);


    /*
       استخراج البيانات
    */

    const title =
        getTitle(page) ||
        folder.name;


    const cover =
        getCover(page);


    const description =
        getDescription(page) ||
        "لم تتم إضافة قصة بعد";


    const genres =
        getGenres(page);


    const workStatus =
        getStatus(page);


    /*
       استخراج اسم الملف الأساسي

       moms-friends.html

       يصبح:

       moms-friends
    */

    const baseName =
        workFile.name.replace(
            /\.html$/i,
            ""
        );


    /*
       استخراج الفصول

       moms-friends-chapter-1.html
       moms-friends-chapter-2.html
       ...
    */

    const chapterRegex =
        new RegExp(
            `^${baseName}-chapter-(\\d+)\\.html$`,
            "i"
        );


    const chapters = files
        .filter(
            file =>
                file.type === "file" &&
                chapterRegex.test(file.name)
        )
        .map(file => {

            const match =
                file.name.match(
                    chapterRegex
                );

            return {
                n: Number(match[1]),
                file: file.name
            };
        })
        .sort(
            (a, b) => b.n - a.n
        );


    return {

        title,

        slug: folder.name,

        cover,

        description,

        genres,

        status: workStatus,

        file: workPath,

        chapters

    };
}


/* =========================================================
   LOAD ALL WORKS
========================================================= */

async function init() {

    try {

        const files =
            await contents(ROOT);


        /*
           فقط مجلدات الأعمال

           index.json يتم تجاهله تلقائياً
        */

        const folders =
            files.filter(
                file =>
                    file.type === "dir"
            );


        works =
            (
                await Promise.all(
                    folders.map(load)
                )
            )
            .filter(Boolean);


        render();

    } catch (error) {

        console.error(error);

        worksEl.innerHTML = `
            <div class="empty">
                ${esc(error.message)}
            </div>
        `;
    }
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    const list =
        works.filter(work => {

            const statusMatch =
                status === "all" ||
                work.status === status;


            const searchText = [
                work.title,
                work.description,
                ...work.genres
            ]
                .join(" ")
                .toLowerCase();


            const searchMatch =
                searchText.includes(q);


            return (
                statusMatch &&
                searchMatch
            );
        });


    count.textContent =
        `${list.length} عمل`;


    worksEl.innerHTML = "";


    empty.hidden =
        list.length !== 0;


    list.forEach(work => {

        const card =
            document.createElement("article");


        card.className =
            "work";


        /*
           الغلاف

           إذا كان موجوداً نستخدمه.
           إذا لم يوجد نستخدم MangaX.
        */

        const coverHTML =
            work.cover
                ? `
                    <img
                        src="${esc(work.cover)}"
                        alt="${esc(work.title)}"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='https://placehold.co/600x850/15151e/8b5cf6?text=MangaX';
                        "
                    >
                  `
                : `
                    <div class="no-cover">
                        <span>MangaX</span>
                    </div>
                  `;


        /*
           التصنيفات
        */

        const genresHTML =
            work.genres
                .map(
                    genre =>
                        `<span class="genre">
                            ${esc(genre)}
                        </span>`
                )
                .join("");


        /*
           بطاقة العمل
        */

        card.innerHTML = `

            <div class="cover">

                ${coverHTML}

                <span class="status">
                    ${esc(
                        statusNames[work.status]
                        || work.status
                    )}
                </span>

            </div>


            <div class="work-info">

                <h3>
                    ${esc(work.title)}
                </h3>


                <p class="description">
                    ${esc(work.description)}
                </p>


                <div>
                    ${genresHTML}
                </div>


                <a
                    class="read"
                    href="${enc(work.file)}"
                >
                    عرض العمل
                </a>

            </div>
        `;


        worksEl.appendChild(card);
    });
}


/* =========================================================
   SEARCH
========================================================= */

search.addEventListener(
    "input",
    event => {

        q =
            event.target.value
                .toLowerCase()
                .trim();

        render();
    }
);


/* =========================================================
   FILTERS
========================================================= */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.onclick = () => {

            document
                .querySelectorAll(".filter")
                .forEach(item =>
                    item.classList.remove("active")
                );


            button.classList.add(
                "active"
            );


            status =
                button.dataset.status;


            render();
        };
    });


/* =========================================================
   START
========================================================= */

init();
