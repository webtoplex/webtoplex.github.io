var use_global_synq_token = true;

let $ = selector => document.querySelector(selector),
    R = RegExp,
    apikey, country,
    genres = {
        28:    "Action",
        12:    "Adventure",
        16:    "Animation",
        35:    "Comedy",
        80:    "Crime",
        99:    "Documentary",
        18:    "Drama",
        10751: "Family",
        14:    "Fantasy",
        36:    "History",
        27:    "Horror",
        10402: "Music",
        9648:  "Mystery",
        10749: "Romance",
        878:   "Science Fiction",
        10770: "TV Movie",
        53:    "Thriller",
        10752: "War",
        37:    "Western",

        10759: "Action & Adventure",
        10762: "Kids",
        10763: "News",
        10764: "Reality",
        10765: "Sci-Fi & Fantasy",
        10766: "Soap Opera",
        10767: "Talk",
        10768: "War & Politics",
    },
    ColorPicker = new ColorThief;

function comify(number = 0) {
    number = (number + '')
        .split('')
        .reverse()
        .join('')
        .replace(/(\d{3})/g, '$1,')
        .split('')
        .reverse()
        .join('')
        .replace(/,+/g, ',')
        .replace(/^,+|,+$/g, '');

    return number;
}

function modify({ type, title, year, similar, info }) {
    let object = { title, year, ...info };

    document.title = `Web to Plex \u2014 ${title} (${year})`;

    $('#data').setAttribute('type', type);

    let SetDominantColor = (image, container = '#card', sample_size = 50) => {
        let color = ColorPicker.getColor(image, sample_size),
            palette = ColorPicker.getPalette(image, null, sample_size),
            random_palette = [color, ...palette].sort(() => Math.random() - 0.5),
            random = () => random_palette.pop(),
            name = container.replace(/\W+/g, ''),
            first;

        $('#after-effect').innerHTML += `
            /* Animate ${ container } */
            ${ container } {
                box-shadow: 0 0 100px -45px rgb(${ first = random() });
            }

            ${ container }:hover {
                animation: color-${ name } 15s infinite;
            }

            @keyframes color-${ name } {
                ${
                    (() => {
                        let values = [`0% { box-shadow: 0 0 100px -45px rgb(${ first }) }`];

                        for(let random_color, index = 1, length = random_palette.length; index < length; index++) {
                            random_color = random_palette.pop();

                            values.push(`${ ((index / length) * 100) | 0 }% { box-shadow: 0 0 100px -45px rgb(${ random_color }) }`);
                        }

                        return values.join('\n                ');
                    })()
                }
            }
        `;
    };

    let maxWidth = (string = '', length = 40, placeholder = '...') => (string.length > length? string.slice(0, length - placeholder.length) + placeholder: string).replace(/\s*[\-\+\:\;\,\.\?\!]?\.{3}$/, '...');

    // object.description = maxWidth(object.description, 250);

    let element;
    for(let key in object)
        if(/^([it]mdb|tvdb)$/i.test(key)) {
            $('#data').setAttribute(key, object[key]);
        } else if(element = $(`#${ key }, .${ key }`)) {
            let value = object[key];

            if(/^(poster)$/i.test(key)) {
                element.crossOrigin = "Anonymous";
                element.src = `https://image.tmdb.org/t/p/original${ value[1] || '/' }`;
                $('#blur-effect').setAttribute('style', `background: url("img/noise.png") fixed, url("https://image.tmdb.org/t/p/original${ value[0] }") fixed center / cover no-repeat;`);

                if(element.complete) {
                    SetDominantColor(element);
                } else {
                    element.addEventListener('load', event => SetDominantColor(event.target));
                }
            } else if(/^(trailer)$/i.test(key)) {
                element.href = `https://www.youtube.com/embed/${ value }`;
            } else {
                element.innerHTML = value.join? value.join('/'): value;
            }
        }

    for(let item of similar.slice(0, 10)) {
        /* item (movie)
         *******************************
         * adult: <boolean>
         * backdrop_path: <string>
         * genre_ids: <array>
         * id: <integer>
         * original_language: <string>
         * original_title: <string>
         * overview: <string>
         * popularity: <float>
         * poster_path: <string>
         * release_date: <string>
         * title: <string>
         * video: <boolean>
         * vote_average: <float>
         * vote_count: <integer>
         ********************************
         * item (tv show)
         ********************************
         * backdrop_path: <string>
         * first_air_date: <string>
         * genre_ids: <array>
         * id: <integer>
         * name: <string>
         * original_title: <array>
         * original_language: <string>
         * original_name: <string>
         * overview: <string>
         * popularity: <float>
         * poster_path: <string>
         * vote_average: <float>
         * vote_count: <integer>
         */
        let { adult, backdrop_path, first_air_date, genre_ids, id, name, original_language, original_name, original_title, overview, popularity, poster_path, release_date, title, video, vote_average, vote_count } = item,
            year = parseInt(release_date || first_air_date),
            controller_id = poster_path.replace(/\W+/g, '');

        let html = `
            <a id="card_${ controller_id }" class="card" href="?${ type }=${ id }" title="${ original_title || original_name }">
                <div class="data" type="${ type }">
                    <div class="header">
                        <img class="poster" />

                        <h3 class="title">${ title || name }</h3>
                        <h6 class="year">${ year }</h6>
                        <div class="meta">
                            <!--
                            <span class="rating">N/R</span>
                            <span class="runtime">0:00</span>
                            -->
                            <span class="genre">${ genre_ids.map(g => genres[g]).join('/') }</span>
                        </div>

                        <div class="description">${ maxWidth(overview, 100) }</div>

                        <!--
                        <div class="share">
                            <ul>
                                <li class="share" title="Share"><i class="material-icons">share</i></li>
                                <li class="like" title="Like"><i class="material-icons">favorite</i></li>
                                <li class="trailer" title="Watch trailer"><i class="material-icons">movie</i></li>
                            </ul>
                        </div>
                        -->
                    </div>
                </div>
                <div class="blur-effect" style="background: url('img/noise.png') fixed, url('https://image.tmdb.org/t/p/original${ backdrop_path }') fixed center / cover no-repeat;"></div>
            </a>
        `;

        $('#related').innerHTML += html;

        let element = $(`#card_${ controller_id } .data .header .poster`);

        element.crossOrigin = "Anonymous";
        element.src = `https://image.tmdb.org/t/p/original${ poster_path }`;

        if(element.complete) {
            SetDominantColor(element, `#card_${ controller_id }`, 200);
        } else {
            element.addEventListener('load', event => SetDominantColor(event.target, `#card_${ controller_id }`, 200));
        }
    }
}

async function as(type, id) {
    let data = {},
        tv = type == 'tv';

    $('#head').setAttribute('type', type);
    $('#related').setAttribute('type', type == 'tv'? 'TV Show': 'Movie');
    $('#mix').setAttribute('title', `Go to a random ${ type == 'tv'? 'show': type }`);

    await fetch(`https://api.themoviedb.org/3/${ type }/${ id }?api_key=${ apikey }`, { method: 'GET' })
        .then(r => r.json())
        .then(json => {
            let poster = [json.backdrop_path, json.poster_path],
                title  = json[tv? `${ /^u[sk]$/i.test(country)? '': 'original_' }name`: 'title'],
                releaseDate = json[tv? 'first_air_date': 'release_date'],
                year   = parseInt(releaseDate),
                genre  = json.genres.map(g => g.name).sort().join(' / '),
                imdb   = json.imdb_id,
                description = json.overview,
                runtime = (m => {let h=0;for(;m>=60;m-=60,h++);return [h,('0'+m).slice(-2)]})(json[tv?'episode_run_time':'runtime']|0).join(':')+(tv?'/Eps':''),
                { vote_average, vote_count } = json;

            data = {
                type, title, year,
                'info': {
                    runtime, genre, poster, description,
                    'release-date': `${ releaseDate.replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, ($0, $1, $2, $3, $$, $_) => `${['January','February','March','April','May','June','July','August','September','October','November','December'][(+$2)-1]} ${$3}, ${$1}`) } (${ country })`,
                    'votes': `${(vote_average * 10)|0}% (${comify(vote_count||0)} votes)`,

                    'imdb': imdb,
                    'tmdb': id,
                },
            };
        });

    // Content Rating
    await fetch(`https://api.themoviedb.org/3/${ type }/${ id }/${ tv? 'content_ratings': 'release_dates' }?api_key=${ apikey }`, { method: 'GET' })
        .then(r => r.json())
        .then(json => {
            if(json.results && json.results.length) {
                let results = json.results.filter(result => result.iso_3166_1 === country)[0] || json.results.filter(results => results.iso_3166_1)[0];

                if(tv)
                    data.info.rating = results.rating;
                else
                    data.info.rating = results.release_dates.filter(o => o.certification)[0],
                    data.info.rating = (data.info.rating? data.info.rating.certification: 'NR');
            }
        });

    // Trailer Links
    await fetch(`https://api.themoviedb.org/3/${ type }/${ id }/videos?api_key=${ apikey }`, { method: 'GET' })
        .then(r => r.json())
        .then(json => {
            if(json.results && json.results.length)
                data.info.trailer = json.results.filter(result => result.iso_3166_1 === country)[0].key;
        });

    // Similar Content
    await fetch(`https://api.themoviedb.org/3/${ type }/${ id }/similar?api_key=${ apikey }`, { method: 'GET' })
        .then(r => r.json())
        .then(async json => {
            let { results } = json;

            if(results && results.length)
                data.similar = results;
            else
                await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=${apikey}&page=${((Math.random()*10)|0)||1}`, { method: 'GET' })
                    .then(r => r.json())
                    .then(json => {
                        let { results } = json;

                        if(results && results.length)
                            data.similar = results;
                    });
        });

    console.log(data);

    return modify(data), data;
}

async function popular(type) {
    return await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=${apikey}&page=${((Math.random()*50)|0)||1}`, { method: 'GET' })
        .then(r => r.json())
        .then(json => {
            let { results } = json,
                { length } = results;

            let item = results[(Math.random()*length)|0];

            return as(type, item.id);
        });
}

document.querySelectorAll('#movie, #tv, #mix').forEach(element => {
    element.onmouseup = async event => {
        let self = event.target;
        let type = $('#data').getAttribute('type'),
            data = await popular(self.id == 'mix'? type: (type = self.id));

        location.search = `?${type}=${data.info.tmdb}`;
    };
});

document.body.onload = event => {
    let data = SynQ.get('login-data');

    if(data) {
        data = decodeURIComponent(data);
        data = atob(data);
        data = SynQ.inflate(data);

        apikey = data.apikey;
        country = data.country;
    } else {
        /* Login Page */
        return open(`login.html${location.search||''}`, '_self');
    }

    /\?(movie|tv)(?:\=(\d+))?/i.test(location.search)?
        as(R.$1, R.$2):
    (async() => {
        let data = await popular(['movie','tv'][+(Math.random>0.5)]);

        location.search = `?${data.type}=${data.info.tmdb}`;
    })();
};

let searching;
$('#search').addEventListener('keyup', event => {
    if(searching)
        clearTimeout(searching);

    let type = $('#data').getAttribute('type'),
        query = $('#search').value,
        Query = [];

    query = query.replace(/\s*(adult:(?:(?:inc|exc)(?:lude)?|true|false|yes|no)|lang(?:uage)?:[a-z]{2}-[A-Z]{2}|region:[A-Z]{2}|year:\d{4})\s*/ig, ($0, $1, $$, $_) => {
        let [property, value] = $1.split(':', 2),
            _l = 'toLowerCase',
            _U = 'toUpperCase';

        property = property[_l]();

        if(type == 'movie')
            switch(property) {
                case 'adult':
                    property = 'include_adult';
                    value = /^(inc(?:lude)?|true|yes)$/i.test(value);
                    break;

                case 'language':
                case 'lang':
                    property = 'language';
                    value = value.split('-').map((v, i, a) => i? v[_U](): v[_l]()).join('-');
                    break;

                case 'region':
                    value = value[_U]();
                    break;

                case 'year':
                    break;

                default: return;
            }
        else /* type == 'tv' */
            switch(property) {
                case 'language':
                case 'lang':
                    property = 'language';
                    value = value.split('-').map((v, i, a) => i? v[_U](): v[_l]()).join('-');
                    break;

                case 'year':
                    property = 'first_air_date_year';
                    break;

                default: return;
            };

        Query.push(`${ property }=${ value }`);

        return '';
    });

    Query.push(`query=${encodeURIComponent(query)}`);

    searching = setTimeout(async() => {
        $('#results').innerHTML = '';

        await fetch(`https://api.themoviedb.org/3/search/${type}?api_key=${apikey}&${ Query.join('&') }`)
            .then(r => r.json())
            .then(json => {
                let { results } = json,
                    valid = !!(results && results.length);

                $('#search').setAttribute('valid', valid? true: results? false: '');

                if(valid)
                    for(let index = 0, length = results.length; index < length; index++) {
                        let { title, year, name, id, release_date, first_air_date, vote_average, vote_count, genre_ids, adult, poster_path, overview } = results[index];

						year = (release_date||first_air_date||'').slice(0,4);
						genre_ids = genre_ids.map(i=>genres[i]).join('/');

                        $('#results').innerHTML += index < 5?
`<a href="?${type}=${id}" title="${vote_average}/10 rating (${comify(vote_count)} votes)" style="background: url(https://image.tmdb.org/t/p/original${poster_path}) center right/contain no-repeat; height: 100px;">
    <span class="rating">${adult?'XXX':''}</span> \u2023 <span>${name||title} ${year?`(${year}) `:''}${genre_ids?'&bullet; ':''}${genre_ids}</span>
    <div class="overview">${overview}</div>
</a>`:

`<a href="?${type}=${id}" title="${vote_average}/10 rating (${comify(vote_count)} votes)">
    <span class="rating">${adult?'XXX':''}</span> \u2023 <span>${name||title} ${year?`(${year}) `:''}${genre_ids?'&bullet; ':''}${genre_ids}</span>
</a>`;
                    }
            })
            .then(u => clearTimeout(searching));
    }, 500);
});

$('#logout').addEventListener('mouseup', event => {
    SynQ.clear();

    open(location.search || '', '_self');
});

$('#share .trailer').addEventListener('mouseup', event => {
    let frame = $('#frame'),
        self = event.target;

    frame.addEventListener('load', event => {
        frame.setAttribute('in-use', true);
    });
});

$('#close').addEventListener('mouseup', event => {
    open('blank.html', 'frame');

    setTimeout(() => $('#frame').setAttribute('in-use', false), 1000);
});

if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/web/service-worker.js', { scope: '.' })
            .then(worker => {
                // Success
                console.log(`Service Worker registered [${ worker.scope }]:`, worker);
            }, error => {
                // Error
                console.error(`Service Worker not registered:`, error)
            });
    });
}
