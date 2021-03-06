let storage = localStorage || sessionStorage;

(async() => {
    let $ = (selector, container = document) => [...container.querySelectorAll(selector)];

    /* Adjust table widths */
    $('table tr').forEach(tr => {
        [...tr.children].forEach((child, index, array) => {
            child.setAttribute('style', `width: ${ (100 / array.length) }%`);
        });
    });

    /* Update the GitHub issue counter(s) */
    let GitHubIssues = storage.getItem('GitHubIssues'),
        GitHubIssuesDate = +storage.getItem('GitHubIssuesDate') || 0,
        UpdateIssueTrackers = issues => {
            $('#github-open').forEach(tracker => {
                tracker.innerHTML = issues.length;
            });

            $('#github-total').forEach(tracker => {
                let latest = issues[0];

                if(!latest)
                    return tracker.innerHTML = `<a href="${latest.repository_url}" title="No issues are open!" target="_blank" :black>No issues</a>`;
                tracker.innerHTML = `<a href="${latest.html_url}" title="${latest.title}" target="_blank" :black>Latest Issue (#${latest.number})</a>`;
            });
        },
        GetMostRecentVersion = async() => {
            await fetch('https://api.github.com/repos/webtoplex/browser-extension/releases/latest')
    			.then(response => response.json())
    			.then(version => {
                    version = version.tag_name.replace(/^(v[\d\.]+)[^]*$/, '$1');

                    for(let element of $('[id$="-version"i]'))
                        element.innerHTML = element.innerHTML || version;

                    for(let element of $('#sources ~ *'))
                        element.setAttribute('version', version);
                });
        };

    if(!GitHubIssues || (GitHubIssuesDate + 3600000) < +(new Date))
        await fetch('https://api.github.com/repos/SpaceK33z/web-to-plex/issues?state=open')
            .then(response => response.json())
            .then(issues => {
                issues = issues.filter(issue => !issue.pull_request);

                UpdateIssueTrackers(issues);

                storage.setItem('GitHubIssues', JSON.stringify(issues));
                storage.setItem('GitHubIssuesDate', +(new Date));
            });
    else
        UpdateIssueTrackers(JSON.parse(GitHubIssues));

    GetMostRecentVersion();

    /* Update the rating counters */
    $('[rating]').forEach(rating => {
        let value = parseFloat(rating.getAttribute('rating')),
            stars = [];

        if(!value)
            return;

        for(;value >= 1 && stars.length < 5; value -= 1.0)
            stars.push('full');
        for(;value >= 0.5 && stars.length < 5; value -= 0.5)
            stars.push('half');
        for(;stars.length < 5;)
            stars.push('zero');

        for(let size of stars)
            rating.innerHTML += `<img class="star icon" src="icon/${size}-star.png" />`;
    });

    $('#sources .source').forEach(source => {
        source.addEventListener('click', event => {
            event.preventDefault(true);

            $('#install')[0].setAttribute('source', event.target.innerHTML);
        });
    });
})();
