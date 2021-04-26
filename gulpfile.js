"use strict";

/* Variables */
const {src, parallel, dest, watch, series} = require("gulp");
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const cssBeautify = require('gulp-cssbeautify');
const autoPrefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const stripComments = require('gulp-strip-comments');
const rigger = require('gulp-rigger');
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const del = require('del');
const notify = require('gulp-notify');
const panini = require("panini");

/* Path */
const srcPath = 'src/';
const distPath = 'dist/';

const path = {
    build: {
        html:   distPath,
        js:     distPath + "assets/js/",
        css:    distPath + "assets/css/",
        images: distPath + "assets/images/",
        fonts:  distPath + "assets/fonts/"
    },
    src: {
        html:   srcPath + "*.html",
        js:     srcPath + "assets/js/*.js",
        css:    srcPath + "assets/sass/*.scss",
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    watch: {
        html:   srcPath + "**/*.html",
        js:     srcPath + "assets/js/**/*.js",
        css:    srcPath + "assets/sass/**/*.scss",
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    clean: "./" + distPath
}

/* Tasks */
function server() {
    browserSync.init({
        server: {
            baseDir: "./" + distPath + "/"
        },
        notify: false,
        port: 5000
    });
}

function html() {
    panini.refresh();
    return src(path.src.html, { base: "src/" })
        .pipe(plumber())
        .pipe(panini({
            root:       srcPath,
            layouts:    srcPath + 'tpl/layouts/',
            partials:   srcPath + 'tpl/partials/',
            helpers:    srcPath + 'tpl/helpers/',
            data:       srcPath + 'tpl/data/'
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream());
}

function css() {
    return src(path.src.css, { base: "src/assets/sass/" })
        .pipe(sass())
        .pipe(cssBeautify())
        .pipe(dest(path.build.css))
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(autoPrefixer({
            overrideBrowserslist: ['last 8 version'],
            cascade: true
        }))
        .pipe(concat('style.min.css'))
        .pipe(dest(path.build.css));
}

function cssWatch() {
    return src(path.src.css, {base: srcPath + "assets/sass/"})
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "SCSS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(concat('style.min.css'))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream());
}

function js() {
    return src(path.src.js, {base: srcPath + 'assets/js/'})
        .pipe(rigger())
        .pipe(dest(path.build.js))
        .pipe(stripComments())
        .pipe(uglify())
        .pipe(concat('app.min.js'))
        .pipe(dest(path.build.js));
}

function jsWatch() {
    return src(path.src.js, {base: srcPath + 'assets/js/'})
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "JS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rigger())
        .pipe(concat('app.min.js'))
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream());
}

function images() {
    return src(path.src.images)
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(dest(path.build.images));
}

function imagesWatch() {
    return src(path.src.images)
        .pipe(dest(path.build.images))
        .pipe(browserSync.stream());
}

function fonts() {
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.stream());
}

function clean() {
    return del(path.clean);
}

function watching() {
    watch([path.watch.html], html);
    watch([path.watch.css], cssWatch);
    watch([path.watch.js], jsWatch);
    watch([path.watch.images], imagesWatch);
    watch([path.watch.fonts], fonts);
}

/* Подготовить готовый проэкт к продакшену */
const build = series(clean, parallel(html, css, js, images, fonts));


/* Exports */
exports.server = server;
exports.html = html;
exports.watching = watching;
exports.css = css;
exports.cssWatch = cssWatch;
exports.js = js;
exports.jsWatch = jsWatch;
exports.images = images;
exports.imagesWatch = imagesWatch;
exports.imagesWatch = fonts;

exports.build = build;

exports.watching = watching;
exports.default = parallel(fonts, imagesWatch, html, cssWatch, jsWatch, server, watching);