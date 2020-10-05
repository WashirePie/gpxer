class UIModal
{
    constructor()
    {
        this.overlayDiv = document.createElement('div')
        this.overlayDiv.className = 'modal-overlay';

        this.modalDiv = document.createElement('div')
        this.modalDiv.className = 'modal';

        this.modalMessage = document.createElement('p')
        this.modalMessage.className = 'modal-message';
        this.modalMessage.innerHTML = 'Select a valid .gpx file';

        this.modalOptions = document.createElement('div')
        this.modalOptions.className = 'modal-options';

        this.fileInputLabel = document.createElement('label')
        this.fileInputLabel.className = 'modal-file-input-label';
        this.fileInputLabel.htmlFor = 'modal-file-input';
        this.fileInputLabel.innerHTML = 'Browse...';

        this.fileInput = document.createElement('input')
        this.fileInput .className = 'modal-file-input';
        this.fileInput.type = 'file';
        this.fileInput.id = 'modal-file-input';

        this.overlayDiv.appendChild(this.modalDiv);
        this.modalDiv.appendChild(this.modalMessage);
        this.modalDiv.appendChild(this.modalOptions);
        this.modalOptions.appendChild(this.fileInputLabel);
        this.modalOptions.appendChild(this.fileInput);

        /* Show modal */
        document.getElementsByTagName('body')[0].appendChild(this.overlayDiv);
    }


    awaitUserFile = async() =>
    {
        /* Wait until user accepts */
        while (true)
        {
            await waitListener(this.fileInput, 'change');
        
            if (!/\.(gpx)$/i.test(this.fileInput.files[0]?.name))
            {
                GPXConverter.e(`file of type '.gpx' expected!`);
            }
            else
            {
                /* Remove modal */
                this.overlayDiv.style.display = 'none';
                // this.overlayDiv.parentNode.removeChild(this.element);
    
                return await this.#readFile(this.fileInput.files[0]);
            }
        }
            
    }

    #readFile(file)
    {
        return new Promise((resolve, reject) =>
        {
            var fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result)
            };
            fr.readAsText(file);
        });
    }
}


const waitListener = (element, listenerName) =>
{
    return new Promise(function (resolve, reject)
    {
        var listener = event =>
        {
            try { element.removeEventListener(listenerName, listener); }
            catch (error) { }
            resolve(event);
        };
        element.addEventListener(listenerName, listener);
    });
}