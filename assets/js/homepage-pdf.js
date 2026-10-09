(() => {
  'use strict';
  const wrapper = document.querySelector('.wrapper');
  if (!wrapper) return;
  const bar = document.createElement('div');
  bar.className = 'homepage-export';
  bar.innerHTML = '<button type="button" class="pdf-button" aria-label="Download homepage as A4 PDF" title="Save the complete homepage as A4 PDF">↓ PDF</button><span class="pdf-export-status" role="status" aria-live="polite"></span>';
  wrapper.before(bar);
  const button = bar.querySelector('button');
  const status = bar.querySelector('[role="status"]');
  let previousBlobUrl;
  const WIDTH = 1000;
  const MM_WIDTH = 194;
  const MAX_HEIGHT = Math.floor(276 / MM_WIDTH * WIDTH);
  const exportStyles = `
    html,body{margin:0!important;padding:0!important;background:white!important;color-scheme:only light}
    .wrapper{display:flex!important;align-items:stretch;width:1000px!important;max-width:none!important;margin:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;zoom:1!important}
    .wrapper .sidebar-wrapper{flex:0 0 290px!important;width:290px!important;order:1;position:static!important;background:#315f69!important}
    .wrapper .main-wrapper{flex:0 0 710px!important;width:710px!important;order:2;padding:32px!important;background:white!important;font-size:16px!important}
    .wrapper .profile-container{display:block!important;padding:28px 16px!important;text-align:center!important}
    .wrapper .profile-container .avatar{display:block!important;width:160px!important;height:160px!important;max-width:160px!important;margin:0 auto 18px!important}
    .wrapper .profile-container .name{font-size:28px!important;line-height:1.15!important;margin:0 0 10px!important}
    .wrapper .profile-container .tagline{font-size:14px!important;line-height:1.4!important;white-space:normal!important;margin:0!important}
    .wrapper .container-block{padding:24px 20px!important}
    .wrapper .contact-list{display:block!important}.wrapper .contact-list li{font-size:14px!important;margin:0 0 14px!important}
    .wrapper .upper-row,.wrapper .second-upper-row{display:flex!important;flex-wrap:wrap!important;gap:3px 12px}
    .wrapper .time{position:static!important;flex:0 0 auto!important;margin:0 0 0 auto!important;padding:0!important}
    .wrapper .upper-row .job-title,.wrapper .upper-row .degree{flex:1;min-width:0}
    .wrapper a,.wrapper u{text-decoration:none!important}
    .wrapper .section{margin-bottom:30px!important}.wrapper .item{margin-bottom:20px!important}
    .wrapper details::details-content{display:block!important;content-visibility:visible!important}
    .wrapper .review-content,.wrapper .activities-content{display:block!important}
    .wrapper .review-toggle,.wrapper .activities-toggle,.wrapper .mobile-supporting-info{display:none!important}
    .wrapper #activities .activity-card{display:flex!important;gap:20px!important;align-items:center!important;margin-bottom:20px!important}
    .wrapper #activities .activity-card>img{flex:0 0 160px!important;width:160px!important;height:120px!important;object-fit:cover!important}
    .wrapper #activities .activity-copy{flex:1;min-width:0}
    .pdf-sheet{position:relative;width:1000px;overflow:hidden;background:white}
    *{animation:none!important;transition:none!important}
  `;

  const waitImage = (image) => new Promise((resolve, reject) => {
    if (image.complete) return image.naturalWidth ? resolve() : reject(new Error('Image unavailable'));
    image.onload = resolve;
    image.onerror = () => reject(new Error('Image unavailable'));
  });

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Preparing…';
    status.textContent = 'Preparing the complete homepage…';
    let frame;
    try {
      frame = document.createElement('iframe');
      frame.title = 'PDF preparation';
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:1000px;height:1600px;border:0;pointer-events:none;';
      document.body.append(frame);
      const doc = frame.contentDocument;
      const styles = [...document.querySelectorAll('link[rel="stylesheet"],head style')]
        .filter(e => e.media !== 'print').map(e => e.outerHTML).join('');
      doc.open();
      doc.write('<!doctype html><html><head><meta charset="utf-8"><base href="' + document.baseURI.replace(/"/g, '&quot;') + '">' + styles + '<style>' + exportStyles + '</style></head><body></body></html>');
      doc.close();
      const clone = wrapper.cloneNode(true);
      clone.querySelectorAll('script,.homepage-export').forEach(e => e.remove());
      clone.querySelectorAll('details').forEach(e => { e.open = true; });
      const sidebar = clone.querySelector('.sidebar-wrapper');
      clone.querySelectorAll('.mobile-supporting-info > .languages-container,.mobile-supporting-info > .skills-container').forEach(e => sidebar.append(e));
      clone.querySelectorAll('img').forEach(e => { e.loading = 'eager'; e.src = new URL(e.getAttribute('src'), document.baseURI).href; });
      clone.querySelectorAll('a[href]').forEach(e => { e.href = new URL(e.getAttribute('href'), 'https://yonghoonjeong.github.io/').href; });
      doc.body.append(clone);
      await Promise.all([...doc.querySelectorAll('link[rel="stylesheet"]')].map(e => e.sheet ? Promise.resolve() : new Promise((resolve, reject) => { e.onload = resolve; e.onerror = reject; })));
      await doc.fonts.ready;
      await Promise.all([...clone.querySelectorAll('img')].map(waitImage));
      const source = document.querySelector('script[src*="html2pdf.bundle"]');
      if (!source) throw new Error('PDF library missing');
      await new Promise((resolve, reject) => {
        const script = doc.createElement('script');
        script.src = source.src;
        if (source.integrity) { script.integrity = source.integrity; script.crossOrigin = 'anonymous'; }
        script.onload = resolve; script.onerror = reject; doc.head.append(script);
      });

      const top = clone.getBoundingClientRect().top;
      const height = Math.ceil(clone.getBoundingClientRect().height);
      const protectedRanges = [...clone.querySelectorAll('.item,.activity-card,.container-block,.profile-container,p,h2,h3,summary')].map(e => {
        const r = e.getBoundingClientRect();
        let bottom = r.bottom - top;
        if (e.matches('h2,h3,summary')) bottom += 65;
        return {top:r.top-top-6,bottom:bottom+6};
      }).filter(r => r.bottom > r.top && r.bottom-r.top < MAX_HEIGHT);
      const pages = [];
      let start = 0;
      while (start < height) {
        let end = Math.min(start + MAX_HEIGHT, height);
        if (end < height) {
          let changed = true;
          while (changed) {
            changed = false;
            for (const range of protectedRanges) {
              if (range.top > start + 40 && range.top < end && range.bottom > end) {
                end = Math.floor(range.top); changed = true;
              }
            }
          }
        }
        if (end <= start) throw new Error('Unable to paginate');
        pages.push({start, end}); start = end;
      }
      const links = [...clone.querySelectorAll('a[href]')].flatMap(e => [...e.getClientRects()].map(r => ({url:e.href,x:r.left,y:r.top-top,w:r.width,h:r.height})));
      const sheet = doc.createElement('div');
      sheet.className = 'pdf-sheet'; clone.before(sheet); sheet.append(clone);
      clone.style.position = 'absolute'; clone.style.left = '0';
      let pdf;
      for (let i = 0; i < pages.length; i++) {
        const {start,end} = pages[i];
        const sliceHeight = end - start;
        sheet.style.height = sliceHeight + 'px'; clone.style.top = -start + 'px';
        button.textContent = 'PDF ' + (i+1) + '/' + pages.length;
        status.textContent = 'Creating page ' + (i+1) + ' of ' + pages.length + '…';
        const options = {margin:8,enableLinks:false,pagebreak:{mode:[]},image:{type:'jpeg',quality:.96},html2canvas:{scale:2,width:WIDTH,height:sliceHeight,windowWidth:WIDTH,windowHeight:1600,scrollX:0,scrollY:0,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true}};
        const canvas = await frame.contentWindow.html2pdf().set(options).from(sheet).toCanvas().get('canvas');
        if (!pdf) pdf = await frame.contentWindow.html2pdf().set(options).from(canvas,'canvas').toPdf().get('pdf');
        else { pdf.addPage(); pdf.addImage(canvas.toDataURL('image/jpeg',.96),'JPEG',8,8,MM_WIDTH,sliceHeight/WIDTH*MM_WIDTH); }
        const ratio = MM_WIDTH/WIDTH;
        links.filter(l=>l.y>=start && l.y+l.h<=end).forEach(l=>pdf.link(8+l.x*ratio,8+(l.y-start)*ratio,l.w*ratio,l.h*ratio,{url:l.url}));
        pdf.setFontSize(8);pdf.setTextColor(100,110,115);
        pdf.text('Yonghoon Jeong | Homepage',8,291);
        pdf.text((i+1)+' / '+pages.length,202,291,{align:'right'});
        canvas.width = canvas.height = 1;
      }
      pdf.setProperties({title:'Yonghoon Jeong - Academic Homepage',author:'Yonghoon Jeong'});
      if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
      const blobUrl = URL.createObjectURL(pdf.output('blob'));
      previousBlobUrl = blobUrl;
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Yonghoon_Jeong_Homepage.pdf';
      link.textContent = 'Download PDF';
      status.replaceChildren(document.createTextNode('PDF ready. '), link);
      link.click();

    } catch (error) {
      console.error('Homepage PDF export failed',error);
      status.textContent = 'Unable to create the PDF. Please check your connection and try again.';
    } finally {
      frame?.remove(); button.disabled = false; button.textContent = '↓ PDF';
    }
  });
})();
