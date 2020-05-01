var use_global_synq_token = true;

let $ = selector => document.querySelector(selector),
    R = RegExp,
    apikey, country;

document.body.onload = event => {
    let data = SynQ.get('login-data');

    if(data) {
        data = decodeURIComponent(data);
        data = atob(data);
        data = JSON.parse(data);

        /* Main Page */
        if(data.apikey && data.country)
            return open(`index.html${ location.search || '' }`, '_self');
    }
};

$('#login').onmouseup = async event => {
    let apikey = $('#apikey:valid:not(:placeholder-shown)'),
        country = $('#country:valid:not(:placeholder-shown)');

    if(!apikey)
        return alert('A TMDb API key is required to use this site');
    if(!country)
        country = 'US';
    else
        country = country.value.toUpperCase();

    apikey = apikey.value;

    await fetch(`https://api.themoviedb.org/3/configuration/countries?api_key=${ apikey }`, { method: 'GET' })
        .then(r => r.json())
        .then(json => {
            if(json.status_message) {
                $('#apikey').setAttribute('valid', false);
                alert(json.status_message);
                throw json.status_message;
            }

            json.filter(object => object.iso_3166_1 === country);

            if(!json.length) {
                let error = `Invalid country code "${ country }"`;

                alert(error);
                throw error;
            }
        })
        .catch(error => { throw error });

    let data = JSON.stringify({ apikey, country });
    data = encodeURIComponent(btoa(data));

    SynQ.set('login-data', data);

    /* Main Page */
    open(`index.html${ location.search || '' }`, '_self');
};

$('#help').onmouseup = event => open('https://developers.themoviedb.org/3', '_blank');

// todo: add synq for easier caching
