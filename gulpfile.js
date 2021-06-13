const gulp = require('gulp');
const browserify = require('browserify');
const watchify = require('watchify');
const errorify = require('errorify');
const del = require('del');
const tsify = require('tsify');
const gulpTypings = require('gulp-typings');
const source = require('vinyl-source-stream');

function createBrowserifier(entry) {
    return browserify({
        basedir: '.',
        debug: true,
        entries: [entry],
        cache: {},
        packageCache: {}
    })
        .plugin(tsify)
        .plugin(watchify)
        .plugin(errorify);
}

function bundle(browserifier, bundleName, destination) {
    return browserifier
        .bundle()
        .pipe(source(bundleName))
        .pipe(gulp.dest(destination));
}

gulp.task('clean', () => {
    return del('./javascript/**/*')
});

gulp.task('installTypings', () => {
    return gulp.src('typings.json').pipe(gulpTypings());
});

gulp.task('tsc-browserify-src', () => {
    return bundle(
        createBrowserifier('./typescript/main.ts'),
        'bundle.js',
        'javascript');
});

gulp.task(
    'default',
    gulp.series(gulp.parallel('clean', 'installTypings'), 'tsc-browserify-src', (done) => {
        console.log('Watching...')
        gulp.watch(
            'typescript/**/*.ts',
            gulp.series('tsc-browserify-src'),
        );
        done();
    }),
);
