document.addEventListener('DOMContentLoaded', async () => {
    const goButton = document.getElementById('go-button');
    const aboutButton = document.getElementById('about-button');
    const backButton = document.getElementById('back-button');

    // about
    if (aboutButton) {
        aboutButton.disabled = false;
        aboutButton.addEventListener('click', () => {
            window.location.href = 'safeldn2.html';
        });
    }

    // back

    if (backButton) {
        backButton.disabled = false;
        backButton.addEventListener('click', () => {
            window.location.href = 'safeldn.html';
        });
    }

    // disable go
    goButton.innerText = 'Loading...';
    goButton.disabled = true;

    try {
        await window.loadMap();
        goButton.innerText = 'Go to Map';
        goButton.disabled = false;
    } catch (error) {
        console.error('Error initializing map:', error);
        goButton.innerText = 'Error';
    }

    // click go

    goButton.addEventListener('click', () => {
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    });
});
