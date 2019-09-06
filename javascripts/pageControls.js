	var crypto;
	var pki;
	var rsa;

	var expandedKey;
	var teamId;
	var teamName;
	var teamKey;
	var teamSearchKey;
	var privateKey;
	var searchKey;
	var itemKey;
	var itemIV;
	var envelopeIV;
	var ivEnvelopeIV;
	var keyEnvelope;
	var ivEnvelope;
	var currentEditorId;
	var currentEditor = null;
	var originalEditorContent;
	var currentDownloadingImageElement;

	var oldVersion;
	var currentVersion;
	var itemCopy;
	var itemId;
	var isATeamItem = false;
	var itemSpace;
	var itemPath;
	var itemContainer;
	var itemPosition;
	var itemTags = [];
	var isBlankPageItem = false;
	var editorStateChanged;
	var setupContainerPageKeyValue;
	var pkiDecrypt;
	var setIsATeamItem;

	var currentImageDownloadXhr = null;

	var addr_images = '/images/';
	var svgLock = addr_images + 'lock.svg';
	var svgLen = addr_images + 'len.svg';
	var pngLen = addr_images + 'pngLen.png';
	var statusIsLockOrLen;
	var encrypted_buffer;

	var editorContentsStatus;
	var lastContent;
	var flgIsLoadingFromLocalStorage = false;
	var contentsFromServer = null;
	var pageLocalStorageKey = null;

	var html_selectContentType = '<a href="" class="selectContentType"> Write, Draw, Spreadsheet, Doc, Diagram, etc </a>';
	
	var pageContentType = null;
	var constContentTypeWrite = 'contentType#Write';
	var constContentTypeDraw = 'contentType#Draw';
	var constContentTypeSpreadsheet = 'contentType#Spreadsheet';
	var constContentTypeDoc = 'contentType#Doc';
	var constContentTypeMxGraph = 'contentType#MxGraph';

	var syncfusionKey;

	// library object.
	var lc; // literallycanvas
	var spreadsheet; // spreedsheet
	var mxGraphUI = null;
	// Page for skeleton screen
	function prepareSkeletonScreen()
	{
        $("<style>")
        .prop("type", "text/css")
        .html("\
            @keyframes aniVertical {\
                0% {\
                    opacity: 0.3;\
                }\
                50% {\
                    opacity: 1;\
                }\
                100% {\
                    opacity: 0.3;\
                }\
            }\
            .loading {\
                height: 30px;\
                border-radius: 20px;\
                background-color: #E2E2E2;\
                animation: aniVertical 3s ease;\
                animation-iteration-count: infinite;\
                animation-fill-mode: forwards;\
                opacity: 0;\
            }\
            .content-loading {\
                height: 20px;\
                margin-top:20px;\
                background-color: #E2E2E2;\
                border-radius: 10px;\
                animation: aniVertical 5s ease;\
                animation-iteration-count: infinite;\
                animation-fill-mode: forwards;\
                opacity: 0;\
            }")
        .appendTo("head");

        $('.froala-editor#title').html('');
        $('.froala-editor#content').html('');
        $('.commentsSearchResults').html('');

        $('.froala-editor#title').addClass('loading');
        $('.froala-editor#content').append( "<div class='content-loading' style='width:100%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:70%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:80%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:60%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:90%;'></div>" );
        $('.commentsSearchResults').addClass('loading col-xs-12 col-xs-offset-0 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2');
    }

    function Utf8ArrayToStr(array, limit) {
	    var out, i, len, c;
	    var char2, char3;

	    out = "";
	    len = array.length;
	    if (len > limit) {
	    	len = limit;
	    }
	    i = 0;
	    while(i < len) {
	    c = array[i++];
	    switch(c >> 4)
	    { 
	      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
	        // 0xxxxxxx
	        out += String.fromCharCode(c);
	        break;
	      case 12: case 13:
	        // 110x xxxx   10xx xxxx
	        char2 = array[i++];
	        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
	        break;
	      case 14:
	        // 1110 xxxx  10xx xxxx  10xx xxxx
	        char2 = array[i++];
	        char3 = array[i++];
	        out += String.fromCharCode(((c & 0x0F) << 12) |
	                       ((char2 & 0x3F) << 6) |
	                       ((char3 & 0x3F) << 0));
	        break;
	    }
	    }

	    return out;
	}

    function clearSkeletonScreen()
	{
		$('.froala-editor#title').removeClass('loading');
        $('.froala-editor#content').removeClass( "<div class='content-loading' style='width:100%;'></div>" );
        $('.froala-editor#content').removeClass( "<div class='content-loading' style='width:70%;'></div>" );
        $('.froala-editor#content').removeClass( "<div class='content-loading' style='width:80%;'></div>" );
        $('.froala-editor#content').removeClass( "<div class='content-loading' style='width:60%;'></div>" );
        $('.froala-editor#content').removeClass( "<div class='content-loading' style='width:90%;'></div>" );
        $('.commentsSearchResults').removeClass('loading col-xs-12 col-xs-offset-0 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2');
	}

	// data snippet
	function addSnippet()
	{
		var modalSnippet = `
			<div class='modal fade' id='modalSnippet' tabindex='-1' role='dialog' aria-labelledby='moveItemsModalLabel' aria-hidden='true'>
				<div class='modal-dialog'>
					<div class='modal-content'>
						<div class='modal-header'>
							<button type='button' class='close closeLogDownloadItemsModal' data-dismiss='modal' aria-hidden='true'>&times;</button>
							<h4 class='modal-title' id='moveItemsModalLabel'>Your Encrypted Data Snippet</h4>
							<p>It is what others see without your key. BSafes staffs can't see neither.</p>
						</div>
						<div class='modal-body' style='padding: 0 20px 20px 20px;'>
							<div style='border:1px solid darkgray; border-radius: 5px; padding:10px;'>
								<div class='enc_buffer' style='width:100%; overflow: hidden;'>
									dgsdgaskldghalsghlkdghjklaglanlknlnoinbnbdfasddgsdga
									lsghlkdghjklaglanlknlnoinbnbdfasddgsdgaskldghalsghlkdghjklagl
									anlknlnoinbnbdfasddgsdgaskldghalsghlkdghjklaglan
									lknlnoinbnbdfasddgsdgaskldghal
									sghlkdghjklaglanlknlnoinbnbdfasd
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
		$(modalSnippet).appendTo('body');
	}

	function modifyPrevnextButton()
	{
		$('.itemNavigationRow').css('z-index', '1000');
		$('.turningPageRow').css('z-index', '1000');
	}

	// --- Page Control Functions ---
	var pageControlFunctions = {
	    deleteImageOnPage: function(e) {
	        e.preventDefault();
	        var confirmDelete = confirm('Are you sure you want to delete this image?');
	        if (confirmDelete) {
	            var $this = $(this);
	            var itemS3Key = $this.data('key');
	            itemCopy.images = itemCopy.images.filter(function(item) {
	                return itemS3Key !== item.s3Key;
	            });
	            // remove the current image from DOM without reload.
	            $this.closest('.imagePanel').slideUp();
	            itemCopy.update = "images";
	            createNewItemVersionForPage();
	        }
	    },

	    deleteAttachmentOnPage: function(e) {
	        e.preventDefault();
	        var confirmDelete = confirm('Are you sure you want to delete this attachment?');
	        if (confirmDelete) {
	            var $this = $(this);
	            var attachmentKey = $this.closest('.attachment').attr('id');
	            itemCopy.attachments = itemCopy.attachments.filter(function(attachment) {
	                return attachmentKey !== attachment.s3KeyPrefix;
	            });
	            // remove the current attachment from DOM without reload.
	            $this.closest('.attachment').slideUp();
	            itemCopy.update = "attachments";
	            createNewItemVersionForPage();
	        }
	    }
	};
	// --- /Page Control Functions ---
	function setOldVersion(version) {
	    oldVersion = version;
	    $('#itemVersion').text("v." + version);
	};

	function setCurrentVersion(version) {
	    var itemVersionAndVersionHistoryContainer = $('#itemVersion, #itemVersionsHistory');
	    if (!version) {
	        itemVersionAndVersionHistoryContainer.addClass('hidden');
	        return;
	    }
	    itemVersionAndVersionHistoryContainer.removeClass('hidden');
	    currentVersion = version;
	    $('#itemVersion').text("v." + version);
	    initializePageItemVersionsHistory();
	};

	function setupPageControlsKeyValue(key, value) {
	    switch (key) {
	        case 'isBlankPageItem':
	            isBlankPageItem = value;
	            break;
	        default:
	    }
	};

	function setupNewItemKey() {
	    var salt = forge.random.getBytesSync(128);
	    var randomKey = forge.random.getBytesSync(32);
	    itemKey = forge.pkcs5.pbkdf2(randomKey, salt, 10000, 32);
	    itemIV = forge.random.getBytesSync(16);

	    $('.container').data('itemId', itemId);
	    $('.container').data('itemKey', itemKey);
	    $('.container').data('itemIV', itemIV);

	    envelopeIV = forge.random.getBytesSync(16);
	    ivEnvelopeIV = forge.random.getBytesSync(16);
	    var envelopeKey = isATeamItem ? teamKey : expandedKey;
	    keyEnvelope = encryptBinaryString(itemKey, envelopeKey, envelopeIV);
	    ivEnvelope = encryptBinaryString(itemIV, envelopeKey, ivEnvelopeIV);
	};

	function initializePageItemVersionsHistory() {
	    initializeItemVersionsHistory(itemId, function(thisItemVersion) {
	        if (thisItemVersion !== currentVersion || thisItemVersion !== oldVersion) {
	            getPageItem(itemId, expandedKey, privateKey, searchKey, function(err, item) {
	                if (err) {
	                    alert(err);
	                } else {}
	            }, thisItemVersion);
	        }
	    });
	};

	function disableTagsInput() {
	    $('#tagsInput').off();
	    $('#confirmTagsInputBtn').off();
	};

	function disableEditControls() {
	    $('.editControl').addClass('hidden');
	}

	function enableEditControls() {
	    $('.editControl').removeClass('hidden');	    
	}

	function addButtonLock() {
		if ($('.btnLock').length == 0) {
		
			$('.btnFloatingWrite').after( "<div class='btnLock hidden' style='bottom:-5px; position:fixed; z-index:1000;'></div>" );
			$('.btnLock').append("<img src='' style='width:80px; height:80px;'></img>");
			
			var margin = $('.btnFloatingWrite').css('right');
			$('.btnLock').css('left',  parseInt(margin) - 30);
			$('.btnLock img').attr('src', svgLen);

			$('.btnLock').click(function(e) {
				if (statusIsLockOrLen == 'len') {
					$(e.target).trigger('blur');
					var isModalVisible = $('#modalSnippet').is(':visible');
					if (!isModalVisible) {
						//showDownloadItemsModal(currentSpace);
						$('.enc_buffer').html(encrypted_buffer);
						$('#modalSnippet').modal('show');
					}	
				}		

				return false;
			});
		} else {
			$('.btnLock').addClass('hidden');
		}
	}

	function initializeTagsInput() {
	    $('#tagsInput').off();
	    $('#tagsInput').on('tokenfield:createtoken', function(e) {
	            console.log('tokenfield:createtoken');
	            var data = e.attrs.value.split('|')
	        })
	        .on('tokenfield:createdtoken', function(e) {
	            console.log('tokenfield:createdtoken');
	            $('.tagsConfirmRow').removeClass('hidden');
	        })
	        .on('tokenfield:edittoken', function(e) {
	            console.log('tokenfield:edittoken');
	        })
	        .on('tokenfield:removedtoken', function(e) {
	            console.log('tokenfield:removedtoken');
	            $('.tagsConfirmRow').removeClass('hidden');
	        })
	    $('#confirmTagsInputBtn').off();
	    $('#confirmTagsInputBtn').click(function(e) {
	        e.preventDefault();
	        if (isBlankPageItem) {}
	        console.log('confirmTagsInputBtn');
	    	setStatusLock();
	        var tags = $('#tagsInput').tokenfield('getTokens');
	        // add pageContentType
	        if (pageContentType == constContentTypeDraw) {
	        	tags.push({'value': constContentTypeDraw, 'label': constContentTypeDraw});
	        }
	        
	        var encryptedTags = tokenfieldToEncryptedArray(tags, itemKey, itemIV);
	        encrypted_buffer = encryptedTags;
	        encryptedTags.push('null');
	        var thisSearchKey = isATeamItem ? teamSearchKey : searchKey;
	        var tagsTokens = tokenfieldToEncryptedTokens(tags, thisSearchKey);

	        if (isBlankPageItem) {
	            if (itemContainer.substring(0, 1) === 'f') {
	                var addActionOptions = {
	                    "targetContainer": itemContainer,
	                    "targetItem": itemId,
	                    "targetPosition": itemPosition,
	                    "type": 'Page',
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    tags: JSON.stringify(encryptedTags),
	                    tagsTokens: JSON.stringify(tagsTokens)
	                }
	                $.post('/memberAPI/addAnItemAfter',
	                    addActionOptions,
	                    function(data, textStatus, jQxhr) {
	                        if (data.status === 'ok') {
	                            itemCopy = data.item;
	                            setCurrentVersion(itemCopy.version);
	                            var item = data.item;
	                            itemId = item.id;
	                            itemPosition = item.position;
	                            setupContainerPageKeyValue('itemId', itemId);
	                            setupContainerPageKeyValue('itemPosition', itemPosition);
	                            isBlankPageItem = false;
	                            $('.tagsConfirmRow').addClass('hidden');
	                        }
	                    }, 'json');
	            } else if (itemContainer.substring(0, 1) === 'n') {
	                $.post('/memberAPI/createANotebookPage', {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    tags: JSON.stringify(encryptedTags),
	                    tagsTokens: JSON.stringify(tagsTokens)
	                }, function(data, textStatus, jQxhr) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        $('.tagsConfirmRow').addClass('hidden');
	                    }
	                }, 'json');
	            } else if (itemContainer.substring(0, 1) === 'd') {
	                $.post('/memberAPI/createADiaryPage', {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    tags: JSON.stringify(encryptedTags),
	                    tagsTokens: JSON.stringify(tagsTokens)
	                }, function(data, textStatus, jQxhr) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        $('.tagsConfirmRow').addClass('hidden');
	                    }
	                }, 'json');
	            }
	        } else {
	            itemCopy.tags = encryptedTags;
	            itemCopy.tagsTokens = tagsTokens;
	            itemCopy.update = "tags";
	            createNewItemVersionForPage();
	        }
	        setTimeout(setStatusLen, 1500);
	        return false;
	    });

	    $('#cancelTagsInputBtn').off();
	    $('#cancelTagsInputBtn').click(function(e) {
	        e.preventDefault();
	        console.log('cancelTagsInputBtn');
	        setStatusLen();
	        $('#tagsInput').tokenfield('setTokens', itemTags);
	        $('.tagsConfirmRow').addClass('hidden');
	        return false;
	    });
	}

	function initializeTitleEditor(editor) {
	    if (editor.data('froala.editor')) {
	        editor.froalaEditor('destroy');
	    }
	    var title = editor.html();
	    if (title === '') {
	        editor.html("<h2></h2>");
	    }
	    editor.froalaEditor({
	        key: '1ZSZGUSXYSMZb1JGZ==',
	        toolbarButtons: ['undo', 'redo'],
	        toolbarButtonsMD: ['undo', 'redo'],
	        toolbarButtonsSM: ['undo', 'redo'],
	        toolbarButtonsXS: ['undo', 'redo'],
	        placeholderText: "Page Title"
	    });
	    editorInitialized();
	};

	function initializeContentEditor(editor) {
	    if (editor.data('froala.editor')) {
	        editor.froalaEditor('destroy');
	    }
	    editor.froalaEditor({
	        key: '1ZSZGUSXYSMZb1JGZ==',
	        toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertImage', 'insertVideo', 'insertFile', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsMD: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertImage', 'insertVideo', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsSM: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertImage', 'insertVideo', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsXS: ['bold', 'fontSize', 'color', 'paragraphStyle', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'insertLink', 'insertImage', 'insertVideo', 'undo']
	    });
	    editorInitialized();
	};

	function initializeCommentEditor(editor) {
	    if (editor.data('froala.editor')) {
	        editor.froalaEditor('destroy');
	    }
	    editor.froalaEditor({
	        key: '1ZSZGUSXYSMZb1JGZ==',
	        toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertImage', 'insertVideo', 'insertFile', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsMD: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertImage', 'insertVideo', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsSM: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertImage', 'insertVideo', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsXS: ['bold', 'fontSize', 'color', 'paragraphStyle', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'insertLink', 'insertImage', 'insertVideo', 'undo']
	    });
	    editorInitialized();
	};

	function initializeImageWordsEditor(editor) {
	    if (editor.data('froala.editor')) {
	        editor.froalaEditor('destroy');
	    }
	    editor.froalaEditor({
	        key: '1ZSZGUSXYSMZb1JGZ==',
	        toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsMD: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsSM: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'insertLink', 'insertTable', 'undo', 'redo', 'clearFormatting', 'html'],
	        toolbarButtonsXS: ['bold', 'fontSize', 'color', 'paragraphStyle', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'insertLink', 'undo']
	    });
	    editorInitialized();
	};

	function editorInitialized() {
	    $('.btnSave, .btnCancel').removeClass('hidden');
	    $('.btnContentSave').addClass('hidden');
	    editorStateChanged('Editor is initialized');	    
	}

	function handleBtnWriteClicked(e) {
	    e.preventDefault();
	    var downloadingImageContainers = $('.downloadingImageContainer');
	    downloadingImageContainers.each(function() {
	        var imageElement = $(this).find('img');
	        $(this).replaceWith(imageElement);
	    });

	    var $downloadingVideoContainers = $('.downloadingVideoContainer');
	    $downloadingVideoContainers.each(function() {
	        var $downloadVideo = $(this).find('img');
	        $(this).replaceWith($downloadVideo);
	    });

	    var $btnWrite = $(e.target);
	    if ($btnWrite.hasClass('fa-pencil')) {
	        $btnWrite = $btnWrite.parent();
	    }
	    if ($btnWrite.hasClass('btnWriteImageWords')) {
	        var $imagePanel = $(e.target).closest('.imagePanel');
	        var id = $imagePanel.attr('id');
	        currentEditorId = id;
	        $('.navbar-fixed-top, .btnWrite, .pathRow').addClass('hidden');
	        currentEditor = $imagePanel.find('.froala-editor');
	    } else {
	        var id = e.target.id;
	        currentEditorId = id;
	        $('.navbar-fixed-top, .btnWrite, .pathRow').addClass('hidden');

	        var selector = '.froala-editor#' + id;
	        currentEditor = $(selector);
	    }
	    var $editorRow = currentEditor.closest('.editorRow');
	    $editorRow.css('overflow-x', 'initial');
	    originalEditorContent = currentEditor.html();
	    lastContent = originalEditorContent;
	    switch (id) {
	        case 'title':
	            initializeTitleEditor(currentEditor);
	            break;
	        case 'content':
	        	editorContentsStatus = true;
	            initializeContentEditor(currentEditor);
	            break;
	        case 'newComment':
	            initializeCommentEditor(currentEditor);
	        default:
	            if (id.substring(0, 5) === "index") {
	                initializeImageWordsEditor(currentEditor);
	            } else if (id.substring(0, 7) === "comment") {
	                initializeCommentEditor(currentEditor);
	            }
	    };


	    return false;
	};

	function doneEditing() {
		setStatusLen();

		editorContentsStatus = false;
		flgIsLoadingFromLocalStorage = false;
		localStorage.removeItem(pageLocalStorageKey);
	    var $downloadingElements = $('.bSafesDownloading');
	    handleVideoObjects();

	    $downloadingElements.each(function() {
	        attachProgressBar($(this), true);
	    });

	    $('.btnSave').LoadingOverlay('hide');
	    currentEditor.froalaEditor('destroy');
	    var $editorRow = currentEditor.closest('.editorRow');
	    $editorRow.css('overflow-x', 'auto');

	    currentEditor = null;
	    $('.btnSave, .btnCancel').addClass('hidden');
	    $('.othersComment').addClass('hidden');
	    $('.navbar-fixed-top, .btnWrite, .pathRow').removeClass('hidden');

	    if (pageContentType != constContentTypeWrite) {
	    	$('.btnWrite.editControl#content').addClass('hidden');
			$('.btnWrite.btnEditor#content').addClass('hidden');
			$('.btnContentSave').removeClass('hidden');
		}
	    
	    editorStateChanged('Editor is destroyed');
	}

	function setStatusLock() {
		statusIsLockOrLen = 'lock';
		$('.btnLock img').attr('src', svgLock);
		$('.btnLock').removeClass('hidden');
	}

	function setStatusLen() {
		statusIsLockOrLen = 'len';		
		$('.btnLock img').attr('src', svgLen);

		setTimeout(function() {
			if (statusIsLockOrLen == 'len') {
				$('.btnLock img').attr('src', pngLen);
			}
		}, 7000);
	}

	function handleBtnCancelClicked(e) {
	    e.preventDefault();
	    var tempOriginalElement = $('<div></div>');
	    tempOriginalElement.html(originalEditorContent);
	    if (editorContentsStatus && flgIsLoadingFromLocalStorage) {
	    	flgIsLoadingFromLocalStorage = false;
	    	tempOriginalElement.html(contentsFromServer);
	    }
	    var displayedImages = $('.bSafesDisplayed');
	    displayedImages.each(function() {
	        var id = $(this).attr('id');
	        var selector = escapeJQueryIdSelector(id);
	        var src = $(this).attr('src');
	        var imageInOriginal = tempOriginalElement.find(selector);;
	        if (imageInOriginal) {
	            $(imageInOriginal).attr('src', src);
	            $(imageInOriginal).removeClass('bSafesDownloading');
	            $(imageInOriginal).addClass('bSafesDisplayed');
	        }
	    });
	    originalEditorContent = tempOriginalElement.html();
	    currentEditor.on('froalaEditor.html.set', function(e, editor) {
	        doneEditing();
	    });
	    currentEditor.froalaEditor('html.set', originalEditorContent);
	    return false;
	};

	function handleBtnSaveClicked(e) {
	    e.preventDefault();
	    setStatusLock();
	    $('.btnCancel').addClass('hidden');
	    $('.btnSave').LoadingOverlay('show', { background: "rgba(255, 255, 255, 0.0)" });
	    switch (currentEditorId) {
	        case 'title':
	            saveTitle();
	            break;
	        case 'content':
	            //saveWriteTypeContent();
	            saveContent();
	            break;
	        case 'newComment':
	            saveNewComment();
	            break;
	        default:
	            if (currentEditorId.substring(0, 5) === "index") {
	                saveImageWords();
	            } else if (currentEditorId.substring(0, 7) === "comment") {
	                updateComment();
	            }
	    };
	    return false;
	};

	function createNewItemVersionForPage(addedSize) {
	    createNewItemVersion(itemId, itemCopy, currentVersion, addedSize, function(err, data) {
	    	$('.btnContentSave').LoadingOverlay('hide');
	        if (err) {
	            if ((itemCopy.update === 'title') || (itemCopy.update === 'content')) {
	                $('.btnSave').LoadingOverlay('hide');
	                $('.btnCancel').removeClass('hidden');
	            }
	            alert(err.code);
	            return;
	        }
	        itemCopy.accumulatedS3ObjectsInContent = data.accumulatedS3ObjectsInContent;
	        itemCopy.accumulatedAttachments = data.accumulatedAttachments;
	        itemCopy.accumulatedGalleryImages = data.accumulatedGalleryImages;

	        setCurrentVersion(itemCopy.version);
	        if ((itemCopy.update !== "tags") && currentEditor) doneEditing();
	        if ((itemCopy.update === "tags") && (!$('.tagsConfirmRow').hasClass('hidden'))) $('.tagsConfirmRow').addClass('hidden');
	    });
	};

	function saveTitle() {
	    if (isBlankPageItem) {}
	    var title = currentEditor.froalaEditor('html.get');
	    var titleStr = $(title).text();
	    var encodedTitle = forge.util.encodeUtf8(title);
	    var encryptedTitle = encryptBinaryString(encodedTitle, itemKey, itemIV);
	    encrypted_buffer = encryptedTitle;

	    var thisSearchKey = isATeamItem ? teamSearchKey : searchKey;
	    var titleTokens = stringToEncryptedTokens(titleStr, thisSearchKey);

	    if (isBlankPageItem) {
	        if (itemContainer.substring(0, 1) === 'f') {
	            var addActionOptions = {
	                "targetContainer": itemContainer,
	                "targetItem": itemId,
	                "targetPosition": itemPosition,
	                "type": 'Page',
	                "keyEnvelope": keyEnvelope,
	                "ivEnvelope": ivEnvelope,
	                "envelopeIV": envelopeIV,
	                "ivEnvelopeIV": ivEnvelopeIV,
	                "title": encryptedTitle,
	                "titleTokens": JSON.stringify(titleTokens)
	            }

	            $.ajax({
	                url: '/memberAPI/addAnItemAfter',
	                type: 'POST',
	                dataType: 'json',
	                data: addActionOptions,
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        var item = data.item;
	                        itemId = item.id;
	                        itemPosition = item.position;
	                        setupContainerPageKeyValue('itemId', itemId);
	                        setupContainerPageKeyValue('itemPosition', itemPosition);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    } else {
	                        $('.btnSave').LoadingOverlay('hide');
	                        $('.btnCancel').removeClass('hidden');
	                        alert(data.err);
	                    }
	                },
	                timeout: 30000
	            });
	        } else if (itemContainer.substring(0, 1) === 'n') {
	            $.ajax({
	                url: '/memberAPI/createANotebookPage',
	                type: 'POST',
	                dataType: 'json',
	                data: {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    "title": encryptedTitle,
	                    "titleTokens": JSON.stringify(titleTokens)
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    }
	                },
	                timeout: 30000
	            });
	        } else if (itemContainer.substring(0, 1) === 'd') {
	            $.ajax({
	                url: '/memberAPI/createADiaryPage',
	                type: 'POST',
	                dataType: 'json',
	                data: {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    "title": encryptedTitle,
	                    "titleTokens": JSON.stringify(titleTokens)
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    }
	                },
	                timeout: 30000
	            });
	        }
	    } else {
	        itemCopy.title = encryptedTitle;
	        itemCopy.titleTokens = titleTokens;
	        itemCopy.update = "title";
	        createNewItemVersionForPage();
	    }
	}

	function preProcessEditorContentBeforeSaving(content) {
	    var tempElement = $('<div></div>');
	    tempElement.html(content);
	    var images = tempElement.find('.bSafesImage');
	    var s3ObjectsInContent = [];
	    var totalS3ObjectsSize = 0;
	    images.each(function() {
	        var id = $(this).attr('id');
	        var idParts = id.split('&');
	        var s3Key = idParts[0];
	        var dimension = idParts[1];
	        var size = parseInt(idParts[2]);
	        s3ObjectsInContent.push({ s3Key: s3Key, size: size });
	        totalS3ObjectsSize += size;
	        var placeholder = 'https://via.placeholder.com/' + dimension;
	        $(this).attr('src', placeholder);
	    });

	    images.each(function() { // Clean up any bSafes status class
	        $(this).removeClass('bSafesDisplayed');
	        $(this).removeClass('bSafesDownloading');
	    });

	    var videos = tempElement.find('.fr-video');
	    videos.each(function() {
	        var video = $(this).find('video');
	        video.removeClass('fr-draggable');
	        var videoId = video.attr('id');
	        var videoStyle = video.attr('style');
	        var videoImg = $('<img class="bSafesDownloadVideo">');

	        if ($(this).hasClass('fr-dvb')) videoImg.addClass('fr-dib');
	        if ($(this).hasClass('fr-dvi')) videoImg.addClass('fr-dii');
	        if ($(this).hasClass('fr-fvl')) videoImg.addClass('fr-fil');
	        if ($(this).hasClass('fr-fvc')) videoImg.addClass('fr-fic');
	        if ($(this).hasClass('fr-fvr')) videoImg.addClass('fr-fir');

	        videoImg.attr('id', videoId);
	        videoImg.attr('style', videoStyle);
	        var placeholder = 'https://via.placeholder.com/' + '360x200';
	        videoImg.attr('src', placeholder);
	        $(this).replaceWith(videoImg);
	    });

	    var videoImgs = tempElement.find('.bSafesDownloadVideo');
	    videoImgs.each(function() {
	        var thisImg = $(this);
	        var id = $(this).attr('id');
	        var idParts = id.split('&');
	        var s3Key = idParts[0];
	        var size = parseInt(idParts[1]);
	        s3ObjectsInContent.push({ s3Key: s3Key, size: size });
	        totalS3ObjectsSize += size;
	    });
	    return { content: tempElement.html(), s3ObjectsInContent: s3ObjectsInContent, s3ObjectsSize: totalS3ObjectsSize };
	};

	/*
	function saveWriteTypeContent() {
	    if (isBlankPageItem) {}
	    var content = currentEditor.froalaEditor('html.get');
		localStorage.removeItem(pageLocalStorageKey);

	    var result = preProcessEditorContentBeforeSaving(content);
	    if (pageContentType != constContentTypeMxGraph) {
	    	content = result.content;	
	    }	    
	    var s3ObjectsInContent = result.s3ObjectsInContent;
	    var s3ObjectsSize = result.s3ObjectsSize;

	    var encodedContent = forge.util.encodeUtf8(content);
	    var encryptedContent = encryptBinaryString(encodedContent, itemKey, itemIV);
	    encrypted_buffer = encryptedContent;

	    if (isBlankPageItem) {
	        if (itemContainer.substring(0, 1) === 'f') {
	            var addActionOptions = {
	                "targetContainer": itemContainer,
	                "targetItem": itemId,
	                "targetPosition": itemPosition,
	                "type": 'Page',
	                "keyEnvelope": keyEnvelope,
	                "ivEnvelope": ivEnvelope,
	                "envelopeIV": envelopeIV,
	                "ivEnvelopeIV": ivEnvelopeIV,
	                "content": encryptedContent,
	                "s3ObjectsInContent": JSON.stringify(s3ObjectsInContent),
	                "s3ObjectsSizeInContent": s3ObjectsSize
	            }

	            $.ajax({
	                url: '/memberAPI/addAnItemAfter',
	                type: 'POST',
	                dataType: 'json',
	                data: addActionOptions,
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        var item = data.item;
	                        itemId = item.id;
	                        itemPosition = item.position;
	                        setupContainerPageKeyValue('itemId', itemId);
	                        setupContainerPageKeyValue('itemPosition', itemPosition);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    } else {
	                        $('.btnSave').LoadingOverlay('hide');
	                        $('.btnCancel').removeClass('hidden');
	                        alert(data.err);
	                    }
	                },
	                timeout: 30000
	            });
	        } else if (itemContainer.substring(0, 1) === 'n') {
	            $.ajax({
	                url: '/memberAPI/createANotebookPage',
	                type: 'POST',
	                dataType: 'json',
	                data: {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    "content": encryptedContent,
	                    "s3ObjectsInContent": JSON.stringify(s3ObjectsInContent),
	                    "s3ObjectsSizeInContent": s3ObjectsSize
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    }
	                },
	                timeout: 30000
	            });
	        } else if (itemContainer.substring(0, 1) === 'd') {
	            $.ajax({
	                url: '/memberAPI/createADiaryPage',
	                type: 'POST',
	                dataType: 'json',
	                data: {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    "content": encryptedContent,
	                    "s3ObjectsInContent": JSON.stringify(s3ObjectsInContent),
	                    "s3ObjectsSizeInContent": s3ObjectsSize
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    }
	                },
	                timeout: 30000
	            });
	        }
	    } else {
	        itemCopy.content = encryptedContent;
	        itemCopy.s3ObjectsInContent = s3ObjectsInContent;
	        itemCopy.s3ObjectsSizeInContent = s3ObjectsSize;
	        itemCopy.update = "content";

	        createNewItemVersionForPage();

	    }
	};
	*/

	function saveNewComment() {
	    if (isBlankPageItem) {
	        return;
	    }
	    var content = currentEditor.froalaEditor('html.get');
	    content = preProcessEditorContentBeforeSaving(content).content;

	    var encodedContent = forge.util.encodeUtf8(content);
	    var encryptedContent = encryptBinaryString(encodedContent, itemKey, itemIV);
	    encrypted_buffer = encryptedContent;

	    if (isBlankPageItem) {
	        return;
	    } else {
	        itemCopy.content = encryptedContent;
	        $.post('/memberAPI/saveNewPageComment', {
	            itemId: itemId,
	            content: encryptedContent
	        }, function(data, textStatus, jQxhr) {
	            if (data.status === 'ok') {

	                var $comment = $('.commentTemplate').clone().removeClass('commentTemplate hidden').addClass('comment');
	                var id = data.id;
	                $comment.data("id", id);
	                var writerName = "You";
	                var creationTime = "Created, " + formatTimeDisplay(data.creationTime);
	                id = "comment-" + data.creationTime;
	                $comment.attr('id', id);
	                $comment.find('.btnWrite').attr('id', id);
	                $comment.find('.btnWrite').on('click', handleBtnWriteClicked);
	                $comment.find('.fa-pencil').attr('id', id);
	                $comment.find('.froala-editor').attr('id', id);
	                $comment.find('.commentWriterName').html(writerName);
	                $comment.find('.commentCreationTime').html(creationTime);
	                $comment.find('.froala-editor').html(content);
	                var $commentsSearchResults = $('.commentsSearchResults');
	                $commentsSearchResults.append($comment);

	                var $thisEditor = $('.froala-editor#newComment');
	                $thisEditor.on('froalaEditor.html.set', function(e, editor) {
	                    doneEditing();
	                });
	                $thisEditor.froalaEditor('html.set', "");
	            }
	        }, 'json');
	    }
	};

	function updateComment() {
	    var id = currentEditor.closest('.comment').data("id");
	    var commentId = id.split("-")[1];
	    if (isBlankPageItem) {
	        return;
	    }
	    var $comment = currentEditor.closest('.comment');
	    var content = currentEditor.froalaEditor('html.get');
	    content = preProcessEditorContentBeforeSaving(content).content;

	    var encodedContent = forge.util.encodeUtf8(content);
	    var encryptedContent = encryptBinaryString(encodedContent, itemKey, itemIV);

	    if (isBlankPageItem) {
	        return;
	    } else {
	        $.post('/memberAPI/updatePageComment', {
	            itemId: itemId,
	            commentId: commentId,
	            content: encryptedContent
	        }, function(data, textStatus, jQxhr) {
	            if (data.status === 'ok') {
	                var lastUpdateTime = "Updated, " + formatTimeDisplay(data.lastUpdateTime);
	                $comment.find('.commentLastUpdateTime').html(lastUpdateTime);
	                $comment.find('.commentLastUpdateTimeRow').removeClass('hidden');
	                doneEditing();
	            }
	        }, 'json');
	    }
	}

	function saveImageWords() {
	    var content = currentEditor.froalaEditor('html.get');
	    var tempElement = $('<div></div>');
	    tempElement.html(content);

	    content = tempElement.html();
	    var encodedContent = forge.util.encodeUtf8(content);
	    var encryptedContent = encryptBinaryString(encodedContent, itemKey, itemIV);

	    var index = currentEditorId.split('-')[1];
	    itemCopy.images[index].words = encryptedContent;
	    itemCopy.update = "image words";
	    createNewItemVersionForPage();

	};

	function getCurrentContent()
	{
		var content = null;
		if (pageContentType == constContentTypeWrite) {
	    	content = currentEditor.froalaEditor('html.get');
	    } else if ( (pageContentType == constContentTypeDraw) && lc ) {
			content = JSON.stringify(lc.getSnapshot());	
	    } else if ( (pageContentType == constContentTypeSpreadsheet) && spreadsheet) {
	    	content = JSON.stringify(spreadsheet.toJSON(), null, 2);
	    } else if (pageContentType == constContentTypeDoc) {	
	    	content = localStorage.getItem(syncfusionKey);
	    } else if ( (pageContentType == constContentTypeMxGraph) && (mxGraphUI) ) {	    		
	    	content = mxUtils.getXml(mxGraphUI.editor.getGraphXml());
	    }

	    return content;
	}

	//function saveOtherTypeContent() {
	function saveContent() {
		window.onbeforeunload = null;
		$('.btnContentSave').LoadingOverlay('show', { background: "rgba(255, 255, 255, 0.0)" });
		
		// get drawing snapshot...
		//var content = currentEditor.froalaEditor('html.get');
	    var content = getCurrentContent();
	    if (content == null) {
	    	alert('Can not get contents');
	    	return;
	    }
	    
		localStorage.removeItem(pageLocalStorageKey);

	    var result = preProcessEditorContentBeforeSaving(content);
	    //content = result.content;
	    if (pageContentType != constContentTypeMxGraph) {
	    	content = result.content;	
	    }	
	    var s3ObjectsInContent = result.s3ObjectsInContent;
	    var s3ObjectsSize = result.s3ObjectsSize;

	    var encodedContent = forge.util.encodeUtf8(content);
	    var encryptedContent = encryptBinaryString(encodedContent, itemKey, itemIV);
	    encrypted_buffer = encryptedContent;

	    if (isBlankPageItem) {
	        if (itemContainer.substring(0, 1) === 'f') {
	            var addActionOptions = {
	                "targetContainer": itemContainer,
	                "targetItem": itemId,
	                "targetPosition": itemPosition,
	                "type": 'Page',
	                "keyEnvelope": keyEnvelope,
	                "ivEnvelope": ivEnvelope,
	                "envelopeIV": envelopeIV,
	                "ivEnvelopeIV": ivEnvelopeIV,
	                "content": encryptedContent,
	                "s3ObjectsInContent": JSON.stringify(s3ObjectsInContent),
	                "s3ObjectsSizeInContent": s3ObjectsSize
	            }

	            $.ajax({
	                url: '/memberAPI/addAnItemAfter',
	                type: 'POST',
	                dataType: 'json',
	                data: addActionOptions,
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        var item = data.item;
	                        itemId = item.id;
	                        itemPosition = item.position;
	                        setupContainerPageKeyValue('itemId', itemId);
	                        setupContainerPageKeyValue('itemPosition', itemPosition);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    } else {
	                        $('.btnSave').LoadingOverlay('hide');
	                        $('.btnCancel').removeClass('hidden');
	                        alert(data.err);
	                    }
	                },
	                timeout: 30000
	            });
	        } else if (itemContainer.substring(0, 1) === 'n') {
	            $.ajax({
	                url: '/memberAPI/createANotebookPage',
	                type: 'POST',
	                dataType: 'json',
	                data: {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    "content": encryptedContent,
	                    "s3ObjectsInContent": JSON.stringify(s3ObjectsInContent),
	                    "s3ObjectsSizeInContent": s3ObjectsSize
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    }
	                },
	                timeout: 30000
	            });
	        } else if (itemContainer.substring(0, 1) === 'd') {
	            $.ajax({
	                url: '/memberAPI/createADiaryPage',
	                type: 'POST',
	                dataType: 'json',
	                data: {
	                    "itemId": itemId,
	                    "keyEnvelope": keyEnvelope,
	                    "ivEnvelope": ivEnvelope,
	                    "envelopeIV": envelopeIV,
	                    "ivEnvelopeIV": ivEnvelopeIV,
	                    "content": encryptedContent,
	                    "s3ObjectsInContent": JSON.stringify(s3ObjectsInContent),
	                    "s3ObjectsSizeInContent": s3ObjectsSize
	                },
	                error: function(jqXHR, textStatus, errorThrown) {
	                    $('.btnSave').LoadingOverlay('hide');
	                    $('.btnCancel').removeClass('hidden');
	                    alert(textStatus);
	                },
	                success: function(data) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        isBlankPageItem = false;
	                        doneEditing();
	                    }
	                },
	                timeout: 30000
	            });
	        }
	    } else {
	    	// insert pageContentType tag
	    	var tags = $('#tagsInput').tokenfield('getTokens');
			//tags.push({'value': constContentTypeDraw, 'label': constContentTypeDraw});
			tags.push({'value': pageContentType, 'label': pageContentType});
			var encryptedTags = tokenfieldToEncryptedArray(tags, itemKey, itemIV);
			//encrypted_buffer = encryptedTags;
			encryptedTags.push('null');
			var thisSearchKey = isATeamItem ? teamSearchKey : searchKey;
			var tagsTokens = tokenfieldToEncryptedTokens(tags, thisSearchKey);
	    	itemCopy.tags = encryptedTags;
			itemCopy.tagsTokens = tagsTokens;

			// set content
	        itemCopy.content = encryptedContent;
	        itemCopy.s3ObjectsInContent = s3ObjectsInContent;
	        itemCopy.s3ObjectsSizeInContent = s3ObjectsSize;
	        itemCopy.update = "content";

	        createNewItemVersionForPage();

	    }
	};

	function initializeEditorButtons() {
	    $('.btnWrite').off();
	    $('.btnWrite').on('click', handleBtnWriteClicked);
	    $('.btnSave').off();
	    $('.btnSave').on('click', handleBtnSaveClicked);
	    $('.btnCancel').off();
	    $('.btnCancel').on('click', handleBtnCancelClicked);
	}

	function changeDownloadingState($attachment, state) {
	    switch (state) {
	        case 'Attached':
	            $attachment.data('state', 'Attached');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').removeClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        case 'Pending':
	            $attachment.data('state', 'PendingDownload');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').addClass('hidden');
	            $attachment.find('.waitNotice').removeClass('hidden');
	            break;
	        case 'Downloading':
	            $attachment.data('state', 'Downloading');
	            $attachment.find('.stopBtn').removeClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').addClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        case 'Stopped':
	            $attachment.data('state', 'StoppedDownloading');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').removeClass('hidden');
	            $attachment.find('.downloadBtn').addClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        case 'Downloaded':
	            $attachment.data('state', 'Downloaded');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').removeClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        default:
	    }
	};

	function insertImages(e) {
	    e.preventDefault();
	    var files = e.target.files;
	    var $imagePanel = $(e.target).closest('.imagePanel');
	    var $nextImagePanel = $imagePanel.next('.imagePanel');
	    if ($nextImagePanel.length) {
	        uploadImages(files, 'insert', $imagePanel);
	    } else {
	        uploadImages(files, 'appendToTheEnd', $imagePanel);
	    }
	    return false;
	};

	function showGallery(startingIndex) {
	    var $imagePanelsList = $('.imagePanel');
	    var slides = [];
	    for (var i = 0; i < $imagePanelsList.length; i++) {
	        var $img = $($imagePanelsList[i]).find('img');
	        var item = {};
	        item.src = $img.attr('src');
	        item.w = $img.data('width');
	        item.h = $img.data('height');
	        slides.push(item);
	    }
	    var pswpElement = document.querySelectorAll('.pswp')[0];
	    // define options (if needed)
	    var options = {
	        // optionName: 'option value'
	        // for example:
	        index: startingIndex // start at first slide
	    };
	    var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, slides, options);
	    gallery.init();
	}

	function showAttachment(fileName, fileSize) {
	    fileName = DOMPurify.sanitize(fileName);
	    var $attachment = $('.attachmentTemplate').clone().removeClass('attachmentTemplate hidden').addClass('attachment');
	    $attachment.find('.deleteAnAttachment a').on('click', pageControlFunctions.deleteAttachmentOnPage);
	    $attachment.find('.attachmentFileName').text(fileName);
	    $attachment.find('.attachmentFileSize').text(numberWithCommas(fileSize) + ' bytes');
	    $attachment.removeClass('loading');
	    $('.attachments').append($attachment);
	    return $attachment;
	};

	var isUploading = false;
	var isDownloading = false;

	var uploadQueue = [];
	var downloadQueue = [];
	var uploadedAttachments = [];

	function createNewItemVersionForPageForAttachments() {
	    var newAttachments = itemCopy.attachments;
	    var addedSize = 0;
	    for (var i = 0; i < uploadedAttachments.length; i++) {
	        var thisAttachment = { fileName: uploadedAttachments[i].fileName, s3KeyPrefix: uploadedAttachments[i].s3KeyPrefix, size: uploadedAttachments[i].size };
	        addedSize += uploadedAttachments[i].size;
	        newAttachments.push(thisAttachment);
	    }
	    itemCopy.attachments = newAttachments;
	    itemCopy.update = "attachments";
	    createNewItemVersionForPage(addedSize);
	    uploadedAttachments = [];
	}

	var checkUploadDownlodQueue = function() {
	    if (!isDownloading) {
	        if (downloadQueue.length) {
	            isDownloading = true;
	            var downloadEvent = downloadQueue.shift();
	            downloadAttachment(downloadEvent);
	        }
	    }
	    //console.log('isUploading', isUploading);
	    if (!isUploading) {
	        if (uploadQueue.length) {
	            isUploading = true;
	            var $attachment = uploadQueue.shift();
	            uploadAttachment($attachment);
	        } else {
	            if (uploadedAttachments.length) {
	                createNewItemVersionForPageForAttachments();
	            }
	        }
	    }
	    setTimeout(checkUploadDownlodQueue, 1000);
	};

	var queueUploadAttachment = function($attachment) {
	    uploadQueue.push($attachment);
	};

	var queueDownloadEvent = function(e) {
	    e.preventDefault();
	    var $attachment = $(e.target).closest('.attachment');
	    changeDownloadingState($attachment, "Pending");
	    downloadQueue.push(e);
	    return false;
	};

	var downloadAttachment = function(e) {
	    e.preventDefault();
	    var $downloadAttachment = $(e.target).parent();
	    var $attachment = $downloadAttachment.closest('.attachment');
	    var id = $attachment.attr('id');
	    var fileName;
	    var fileType;
	    var fileSize;
	    var numberOfChunks;
	    var chunkIndex = 0;
	    var decryptChunkIndex = 0;
	    var decryptedFileInUint8Array;
	    var decryptedFileIndex;
	    var $decryptChunkDeferred = $.Deferred();
	    var $decryptChunkPromise = $decryptChunkDeferred.promise();
	    $decryptChunkDeferred.resolve();
	    console.log('Download ', id);

	    var downloadedFileProgress = 0;
	    var $progress = $('.attachmentProgressTemplate').clone().removeClass('attachmentProgressTemplate hidden').addClass('attachmentProgressRow');
	    $progress.find('.progress-bar').css('width', 0);
	    $attachment.after($progress);

	    changeDownloadingState($attachment, 'Downloading');

	    function downloadDecryptAndAssemble() {

	        function enableResume() {
	            changeDownloadingState($attachment, 'Stopped');
	            var $resume = $attachment.find('.resumeBtn');
	            $resume.off();
	            $resume.click(function(e) {
	                console.log('resuming downloading chunk:', chunkIndex);
	                changeDownloadingState($attachment, 'Downloading');
	                downloadDecryptAndAssemble();
	            });
	        }

	        function downloadAChunk(signedURL) {
	            var xhr = new XMLHttpRequest();
	            var isDownloaded = false;
	            enableStop();

	            function enableStop() {
	                var $stop = $attachment.find('.stopBtn');
	                $stop.off();
	                $stop.click(function(e) {
	                    xhr.abort();
	                    stopped = true;
	                    console.log('Stopping downloading chunk:', chunkIndex);
	                });
	            };

	            xhr.open('GET', signedURL, true);
	            xhr.responseType = 'arraybuffer';

	            var attachmentFileProgress = 0;
	            var previousProgress = 0;
	            var timer;

	            var timeout = function() {
	                if (xhr) {
	                    if (attachmentFileProgress === previousProgress) {
	                        xhr.abort();
	                    } else {
	                        previousProgress = attachmentFileProgress;
	                        timer = setTimeout(timeout, 10000);
	                    }
	                }
	            };
	            timer = setTimeout(timeout, 10000);

	            xhr.addEventListener("progress", function(evt) {
	                console.log('isDownloaded:', isDownloaded);
	                if (isDownloaded) return;
	                if (evt.lengthComputable) {
	                    attachmentFileProgress = downloadedFileProgress + (evt.loaded / evt.total * 100) / numberOfChunks;
	                    attachmentFileProgress = Math.floor(attachmentFileProgress * 100) / 100;
	                    console.log('file progress:', attachmentFileProgress);
	                    $attachment.find('.attachmentFileProgress').text(attachmentFileProgress + ' %');
	                    $progress.find('.progress-bar').css('width', attachmentFileProgress + '%');
	                }
	            }, false);

	            xhr.onload = function(e) {
	                var encryptedChunkInArrayBuffer = this.response;
	                isDownloaded = true;
	                console.log('isDownloaded:', isDownloaded);

	                console.log('downloaded chunk size:', encryptedChunkInArrayBuffer.byteLength);
	                /*          $(document.getElementById('progressBar'+id)).parent().remove();
	                          $.post('/memberAPI/postS3Download', {
	                            itemId: itemId,
	                            s3Key: s3CommonKey
	                          }, function(data, textStatus, jQxhr ){
	                            if(data.status === 'ok'){
	                              var item = data.item;
	                              var size = item.size;
	                */
	                console.log('Chunk downloaded:', chunkIndex);

	                $decryptChunkPromise.done(function() {
	                    chunkIndex++;
	                    downloadedFileProgress = chunkIndex / numberOfChunks * 100;
	                    if (chunkIndex < numberOfChunks) downloadDecryptAndAssemble();
	                    console.log('Decrypt Chunk:', decryptedFileIndex);
	                    $decryptChunkDeferred = $.Deferred();
	                    $decryptChunkPromise = $decryptChunkDeferred.promise();
	                    decryptChunkInArrayBufferAsync(encryptedChunkInArrayBuffer, decryptedFileInUint8Array, decryptedFileIndex, itemKey, itemIV, function(err, decryptedChunkSize) {

	                        if (err) {
	                            alert(err);
	                            $decryptChunkDeferred.reject();
	                        } else {
	                            console.log('decryptedChunkSize', decryptedChunkSize);
	                            decryptedFileIndex += decryptedChunkSize;
	                            decryptChunkIndex += 1;
	                            console.log(decryptedFileIndex);
	                            if (decryptChunkIndex === numberOfChunks) {
	                                changeDownloadingState($attachment, 'Downloaded');
	                                isDownloading = false;
	                                $attachment.find('.attachmentFileProgress').text('');
	                                $progress.remove();
	                                var blob = new Blob([decryptedFileInUint8Array], { type: fileType });
	                                if (navigator && navigator.msSaveBlob) {
	                                    return navigator.msSaveBlob(blob, fileName);
	                                } else {
	                                    var link = window.URL.createObjectURL(blob);

	                                    var $downloadLink = $('<a href="#" style="display:none">Save</a>');
	                                    $downloadLink.attr('href', link);
	                                    $downloadLink.attr('download', fileName);
	                                    $('.container').append($downloadLink);
	                                    $downloadLink[0].click();
	                                }
	                            }
	                            $decryptChunkDeferred.resolve();
	                        }
	                    });
	                });
	                /*
	                            var link = window.URL.createObjectURL(new Blob([decryptedChunkInUint8Array]), {type: 'image/jpeg'});
	                              $img = $('<img>');
	                              $img.attr('src', link);
	                              $('.container').append($img);

	                              $downloadedElement = $(document.getElementById(id));
	                              $downloadedElement.removeClass('bSafesDownloading');
	                              displayImage(link);
	                            }
	                          }, 'json');*/
	            };


	            xhr.onerror = xhr.onabort = function() {
	                console.log('isDownloaded:', isDownloaded);
	                if (isDownloaded) return;
	                enableResume();
	            };


	            xhr.send();
	        }



	        $.post('/memberAPI/preS3ChunkDownload', {
	                itemId: itemId,
	                chunkIndex: chunkIndex.toString(),
	                s3KeyPrefix: id
	            }, function(data, textStatus, jQxhr) {
	                if (data.status === 'ok') {
	                    console.log(data);
	                    if (chunkIndex === 0) {
	                        var encodedFileName = decryptBinaryString(data.fileName, itemKey, itemIV);
	                        fileName = forge.util.decodeUtf8(encodedFileName);
	                        fileType = data.fileType;
	                        fileSize = data.fileSize;
	                        numberOfChunks = parseInt(data.numberOfChunks);
	                        decryptedFileInUint8Array = new Uint8Array(fileSize);
	                        decryptedFileIndex = 0;
	                    }
	                    downloadAChunk(data.signedURL);
	                }
	            }, 'json')
	            .fail(function() {
	                enableResume();
	            });;
	    };
	    downloadDecryptAndAssemble();
	    return false;
	}

	function changeUploadingState($attachment, state) {
	    switch (state) {
	        case 'Pending':
	            $attachment.data('state', 'PendingUpload');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').addClass('hidden');
	            $attachment.find('.waitNotice').removeClass('hidden');
	            break;
	        case 'Uploading':
	            $attachment.data('state', 'Uploading');
	            $attachment.find('.stopBtn').removeClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').addClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        case 'Stopped':
	            $attachment.data('state', 'StoppedUploading');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').removeClass('hidden');
	            $attachment.find('.downloadBtn').addClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        case 'Attached':
	            $attachment.data('state', 'Attached');
	            $attachment.find('.stopBtn').addClass('hidden');
	            $attachment.find('.resumeBtn').addClass('hidden');
	            $attachment.find('.downloadBtn').removeClass('hidden');
	            $attachment.find('.waitNotice').addClass('hidden');
	            break;
	        default:
	    }
	};

	function uploadAttachment($attachment) {
	    var chunkSize = 10 * 1024 * 1024;
	    var reader;
	    var fileSize;
	    var uploadedFileSize;
	    var uploadedFilePercentage;
	    var numberOfChunks;
	    var chunkIndex = 0;
	    var unencryptedChunkSize;
	    var offset = 0;
	    var s3KeyPrefix;
	    var s3UploadingDeferred;
	    var s3UploadingPromise;

	    setStatusLock();

	    changeUploadingState($attachment, 'Uploading');
	    var file = $attachment.data('file');
	    $progress = $('.attachmentProgressTemplate').clone().removeClass('attachmentProgressTemplate hidden').addClass('attachmentProgressRow');
	    $progress.find('.progress-bar').css('width', 0);
	    $attachment.after($progress);

	    numberOfChunks = Math.floor(file.size / chunkSize) + 1;
	    chunkIndex = 0;
	    offset = 0;
	    s3KeyPrefix = 'null';
	    s3UploadingDeferred = $.Deferred();
	    s3UploadingPromise = s3UploadingDeferred.promise();
	    s3UploadingDeferred.resolve();
	    uploadedFileSize = 0;
	    uploadedFilePercentage = 0;

	    function sliceEncryptAndUpload($attachment, file, resumingChunkIndex) {
	        if (isBlankPageItem) {}
	        fileSize = file.size;
	        if (resumingChunkIndex || resumingChunkIndex === 0) chunkIndex = resumingChunkIndex;

	        console.log('slicing chunk:', chunkIndex);
	        reader = new FileReader();
	        var blob = file.slice(offset, offset + chunkSize);

	        function uploadAChunk(chunkIndex, encryptedData) {
	            var thisUnencryptedChunkSize = unencryptedChunkSize;
	            var myXhr = $.ajaxSettings.xhr();
	            var stopped = false;
	            s3UploadingDeferred = $.Deferred();
	            s3UploadingPromise = s3UploadingDeferred.promise();
	            console.log("uploading chunk", chunkIndex);

	            var s3KeyPrefixParts = s3KeyPrefix.split(':');
	            var timeStamp = s3KeyPrefixParts[s3KeyPrefixParts.length - 1]

	            function preS3ChunkUpload(chunkIndex, fn) {
	                $.post('/memberAPI/preS3ChunkUpload', {
	                        itemId: itemId,
	                        chunkIndex: chunkIndex.toString(),
	                        timeStamp: timeStamp
	                    }, function(data, textStatus, jQxhr) {
	                        if (data.status === 'ok') {
	                            s3Key = data.s3Key;
	                            if (chunkIndex === 0) {
	                                s3KeyPrefix = s3Key.split('_chunk_')[0];
	                            }
	                            console.log('s3Key:', s3Key);
	                            signedURL = data.signedURL;
	                            console.log('signedURL:', signedURL);
	                            fn(null, s3Key, signedURL);
	                        } else {
	                            fn(data.error);
	                        }
	                    }, 'json')
	                    .fail(function() {
	                        fn("preS3ChunkUpload failure");
	                    });
	            };

	            function enableResume() {
	                changeUploadingState($attachment, 'Stopped');
	                $resume = $attachment.find('.resumeBtn');
	                $resume.off();
	                $resume.click(function(e) {
	                    console.log('resuming uploading chunk:', chunkIndex);
	                    offset = chunkIndex * chunkSize;
	                    s3UploadingDeferred = $.Deferred();
	                    s3UploadingPromise = s3UploadingDeferred.promise();
	                    s3UploadingDeferred.resolve();
	                    changeUploadingState($attachment, 'Uploading');
	                    sliceEncryptAndUpload($attachment, file, chunkIndex);
	                });
	            }

	            function enableStop() {
	                var $stop = $attachment.find('.stopBtn');
	                $stop.off();
	                $stop.click(function(e) {
	                    myXhr.abort();
	                    myXhr = null;
	                    stopped = true;
	                    console.log('Stopping uploading chunk:', chunkIndex);
	                });
	            };

	            function enableDownload() {
	                changeUploadingState($attachment, 'Attached');
	                var $download = $attachment.find('.downloadBtn');
	                $download.off();
	                $attachment.attr('id', s3KeyPrefix);
	                $download.click(queueDownloadEvent);
	            };

	            function uploadFailed() {
	                if (uploadedAttachments.length) {
	                    createNewItemVersionForPageForAttachments();
	                }
	                s3UploadingDeferred.reject();
	                enableResume();
	            };

	            preS3ChunkUpload(chunkIndex, function(err, s3Key, signedURL) {
	                if (err) {
	                    uploadFailed();
	                } else {
	                    enableStop();
	                    $.ajax({
	                        type: 'PUT',
	                        url: signedURL,
	                        // Content type must much with the parameter you signed your URL with
	                        contentType: 'binary/octet-stream',
	                        // this flag is important, if not set, it will try to send data as a form
	                        processData: false,
	                        // the actual data is sent raw
	                        data: encryptedData,
	                        xhr: function() {
	                            var complete = 0;
	                            var previousProgress = 0;
	                            var timer;

	                            var timeout = function() {
	                                if (myXhr) {
	                                    if (complete === previousProgress) {
	                                        myXhr.abort();
	                                    } else {
	                                        previousProgress = complete;
	                                        timer = setTimeout(timeout, 10000);
	                                    }
	                                }
	                            };
	                            timer = setTimeout(timeout, 10000);

	                            if (myXhr.upload) {
	                                myXhr.upload.addEventListener('progress', function(e) {
	                                    if (e.lengthComputable) {
	                                        complete = (e.loaded / e.total * 100 | 0);
	                                        console.log('Uploading chunk:', chunkIndex, complete);
	                                        var attachmentFileProgress = uploadedFilePercentage + complete * (thisUnencryptedChunkSize / fileSize);
	                                        attachmentFileProgress = Math.floor(attachmentFileProgress * 100) / 100;
	                                        console.log('attachmentFileProgress:', attachmentFileProgress);
	                                        $attachment.find('.attachmentFileProgress').text(attachmentFileProgress + ' %');
	                                        $attachment.next().find('.progress-bar').css('width', attachmentFileProgress + '%');
	                                    }
	                                }, false);
	                            }
	                            return myXhr;
	                        }
	                    }).success(function() {
	                        console.log('Uploading succeeded:', chunkIndex);
	                        console.log('uploadQueue', uploadQueue);
	                        if (uploadQueue.length < 1) {
	                        	setStatusLen();
	                        }
	                        if (stopped) s3UploadingDeferred.reject();
	                        s3UploadingDeferred.resolve();

	                        uploadedFileSize += thisUnencryptedChunkSize;
	                        uploadedFilePercentage = (uploadedFileSize / fileSize) * 100;

	                        if (chunkIndex === (numberOfChunks - 1)) {
	                            var encodedFileName = forge.util.encodeUtf8(file.name);
	                            var encryptedFileName = encryptBinaryString(encodedFileName, itemKey, itemIV);
	                            if (isBlankPageItem) {
	                                var envelopeIV = forge.random.getBytesSync(16);
	                                var ivEnvelopeIV = forge.random.getBytesSync(16);
	                                var envelopeKey = isATeamItem ? teamKey : expandedKey;
	                                var keyEnvelope = encryptBinaryString(itemKey, envelopeKey, envelopeIV);
	                                var ivEnvelope = encryptBinaryString(itemIV, envelopeKey, ivEnvelopeIV);
	                                if (itemContainer.substring(0, 1) === 'f') {
	                                    var addActionOptions = {
	                                        "targetContainer": itemContainer,
	                                        "targetItem": itemId,
	                                        "targetPosition": itemPosition,
	                                        "type": 'Page',
	                                        "keyEnvelope": keyEnvelope,
	                                        "ivEnvelope": ivEnvelope,
	                                        "envelopeIV": envelopeIV,
	                                        "ivEnvelopeIV": ivEnvelopeIV,
	                                        "s3KeyPrefix": s3KeyPrefix,
	                                        "fileName": encryptedFileName,
	                                        "fileType": file.type,
	                                        "size": file.size,
	                                        "numberOfChunks": numberOfChunks
	                                    }
	                                    $.post('/memberAPI/addAnItemAfter',
	                                        addActionOptions,
	                                        function(data, textStatus, jQxhr) {
	                                            if (data.status === 'ok') {
	                                                itemCopy = data.item;
	                                                setCurrentVersion(itemCopy.version);
	                                                var item = data.item;
	                                                itemId = item.id;
	                                                itemPosition = item.position;
	                                                setupContainerPageKeyValue('itemId', itemId);
	                                                setupContainerPageKeyValue('itemPosition', itemPosition);
	                                                isBlankPageItem = false;
	                                                isUploading = false;
	                                                myXhr = null;
	                                                $attachment.find('.attachmentFileProgress').text('');
	                                                $('.attachmentProgressRow').remove();
	                                                enableDownload();
	                                            } else {
	                                                alert(data.err);
	                                                if (data.err === 'Page Saving Error.') {

	                                                } else {
	                                                    isBlankPageItem = false;
	                                                }
	                                            }
	                                        }, 'json');
	                                } else if (itemContainer.substring(0, 1) === 'n') {
	                                    $.post('/memberAPI/createANotebookPage', {
	                                        "itemId": itemId,
	                                        "keyEnvelope": keyEnvelope,
	                                        "ivEnvelope": ivEnvelope,
	                                        "envelopeIV": envelopeIV,
	                                        "ivEnvelopeIV": ivEnvelopeIV,
	                                        "s3KeyPrefix": s3KeyPrefix,
	                                        "fileName": encryptedFileName,
	                                        "fileType": file.type,
	                                        "size": file.size,
	                                        "numberOfChunks": numberOfChunks
	                                    }, function(data, textStatus, jQxhr) {
	                                        if (data.status === 'ok') {
	                                            itemCopy = data.item;
	                                            setCurrentVersion(itemCopy.version);
	                                            isBlankPageItem = false;
	                                            isUploading = false;
	                                            myXhr = null;
	                                            $attachment.find('.attachmentFileProgress').text('');
	                                            $('.attachmentProgressRow').remove();
	                                            enableDownload();
	                                        } else {
	                                            alert(data.err);
	                                            if (data.err === 'Page Saving Error.') {

	                                            } else {
	                                                isBlankPageItem = false;
	                                            }
	                                        }
	                                    }, 'json');
	                                } else if (itemContainer.substring(0, 1) === 'd') {
	                                    $.post('/memberAPI/createADiaryPage', {
	                                        "itemId": itemId,
	                                        "keyEnvelope": keyEnvelope,
	                                        "ivEnvelope": ivEnvelope,
	                                        "envelopeIV": envelopeIV,
	                                        "ivEnvelopeIV": ivEnvelopeIV,
	                                        "s3KeyPrefix": s3KeyPrefix,
	                                        "fileName": encryptedFileName,
	                                        "fileType": file.type,
	                                        "size": file.size,
	                                        "numberOfChunks": numberOfChunks
	                                    }, function(data, textStatus, jQxhr) {
	                                        if (data.status === 'ok') {
	                                            itemCopy = data.item;
	                                            setCurrentVersion(itemCopy.version);
	                                            isBlankPageItem = false;
	                                            isUploading = false;
	                                            myXhr = null;
	                                            $attachment.find('.attachmentFileProgress').text('');
	                                            $('.attachmentProgressRow').remove();
	                                            enableDownload();
	                                        } else {
	                                            alert(data.err);
	                                            if (data.err === 'Page Saving Error.') {

	                                            } else {
	                                                isBlankPageItem = false;
	                                            }
	                                        }
	                                    }, 'json');
	                                }
	                            } else {
	                                var envelopeIV = forge.random.getBytesSync(16);
	                                var ivEnvelopeIV = forge.random.getBytesSync(16);
	                                var envelopeKey = isATeamItem ? teamKey : expandedKey;
	                                var keyEnvelope = encryptBinaryString(itemKey, envelopeKey, envelopeIV);
	                                var ivEnvelope = encryptBinaryString(itemIV, envelopeKey, ivEnvelopeIV);

	                                var uploadedAttachment = {
	                                    "s3KeyPrefix": s3KeyPrefix,
	                                    "itemId": itemId,
	                                    "keyEnvelope": keyEnvelope,
	                                    "ivEnvelope": ivEnvelope,
	                                    "envelopeIV": envelopeIV,
	                                    "ivEnvelopeIV": ivEnvelopeIV,
	                                    "fileName": encryptedFileName,
	                                    "fileType": file.type ? file.type : "unknown",
	                                    "size": file.size,
	                                    "numberOfChunks": numberOfChunks
	                                };

	                                uploadedAttachments.push(uploadedAttachment);

	                                $.post('/memberAPI/addAnAttachmentToItem',
	                                    uploadedAttachment,
	                                    function(data, textStatus, jQxhr) {
	                                        if (data.status === 'ok') {
	                                            isUploading = false;
	                                            myXhr = null;
	                                            $attachment.find('.attachmentFileProgress').text('');
	                                            $('.attachmentProgressRow').remove();
	                                            enableDownload();
	                                        } else {
	                                            alert('error');
	                                        }
	                                    }, 'json');
	                            }
	                        }
	                    }).error(function(jqXHR, textStatus, errorThrown) {
	                        console.log('Uploading failed', chunkIndex);
	                        alert('Uploading failed');
	                        setStatusLen();
	                        uploadFailed();
	                    });
	                }
	            });
	        };

	        reader.onloadend = function(e) {
	            var data = reader.result;
	            unencryptedChunkSize = data.byteLength;
	            offset += data.byteLength;
	            console.log(chunkIndex + ':' + offset + '<' + file.size);

	            encryptArrayBufferAsync(data, itemKey, itemIV, function(encryptedData) {
	                s3UploadingPromise.done(function() {
	                	//encrypted_buffer = encryptedData;
	                	encrypted_buffer = Utf8ArrayToStr(encryptedData, 1000);
	                    uploadAChunk(chunkIndex, encryptedData);
	                    chunkIndex += 1;

	                    if (offset < file.size) {
	                        sliceEncryptAndUpload($attachment, file);
	                    }

	                }).fail(function() {

	                });
	            });
	        };

	        reader.readAsArrayBuffer(blob);
	    };

	    sliceEncryptAndUpload($attachment, file);
	};

	function uploadImages(files, mode, $imagePanel) {
	    var insertIndex;
	    var uploadedImages = [];

	    function buildUploadImageElements($imagePanel) {
	        var $lastUploadImage = null;
	        var startingUploadIndex;
	        if (mode === 'appendToTheFront') {
	            startingUploadIndex = 0;
	        } else {
	            var thisIndex = $imagePanel.attr('id').split('-')[1];
	            startingUploadIndex = parseInt(thisIndex) + 1;
	        }

	        for (var i = 0; i < files.length; i++) {
	            var file = files[i];
	            var $uploadImage = $('.uploadImageTemplate').clone().removeClass('uploadImageTemplate hidden').addClass('uploadImage');
	            var id = 'index-' + (startingUploadIndex + i);
	            $uploadImage.attr('id', id);
	            $uploadImage.data('file', file);
	            $uploadImage.find('.uploadText').text("Pending");

	            if (!$lastUploadImage) {
	                switch (mode) {
	                    case 'appendToTheFront':
	                        $('.imageBtnRow').after($uploadImage);
	                        break;
	                    case 'insert':
	                    case 'appendToTheEnd':
	                        $imagePanel.after($uploadImage);
	                        break;
	                    default:
	                }
	            } else {
	                $lastUploadImage.after($uploadImage);
	            }
	            $lastUploadImage = $uploadImage;
	        }
	        var $imagePanel = $lastUploadImage.next('.imagePanel');
	        while ($imagePanel.length) {
	            var id = 'index-' + (startingUploadIndex + i++);
	            $imagePanel.attr('id', id);
	            $imagePanel = $imagePanel.next();
	        }
	    }

	    function startUploadingImages() {
	        function uploadingImages(doneUploadingImages) {
	            var $uploadImagesList = $('.uploadImage');
	            var numberOfUploads = $uploadImagesList.length;
	            var index = 0;

	            function uploadAnImage($uploadImage) {
	                var $img;
	                var link;
	                var imageDataInBinaryString;
	                var exifOrientation;
	                var s3Key;
	                var s3ObjectSize;
	                var totalUploadedSize = 0;
	                var $progressBar = $uploadImage.find('.progress-bar');

	                $uploadImage.find('.uploadText').text("Encrypting");
	                console.log("uploadAnImage(index):", index);

	                function startUploadingAnImage() {
	                    var imgDOM = $img[0];
	                    var imageWidth = imgDOM.width;
	                    var imageHeight = imgDOM.height;

	                    $img.off('load');

	                    function uploadToS3(data, fn) {
	                        var signedURL;
	                        var signedGalleryURL;
	                        var signedThumbnailURL;

	                        var prepareGalleryImgDeferred = $.Deferred();
	                        var prepareGalleryImgPromise;
	                        var prepareThumbnailImgDeferred = $.Deferred();
	                        var prepareThumbnailImgPromise = prepareThumbnailImgDeferred.promise();
	                        var uploadOriginalImgDeferred = $.Deferred();
	                        var uploadOriginalImgPromise = uploadOriginalImgDeferred.promise();
	                        var uploadGalleryImgDeferred = $.Deferred();
	                        var uploadGalleryImgPromise = uploadGalleryImgDeferred.promise();
	                        var uploadThumbnailImgDeferred = $.Deferred();
	                        var uploadThumbnailImgPromise = uploadThumbnailImgDeferred.promise();
	                        var originalXhr = null;
	                        var galleryXhr = null;
	                        var thumbnailXhr = null;

	                        function preS3Upload(fn) {
	                            $.ajax({
	                                type: 'POST',
	                                timeout: 7000,
	                                url: "/memberAPI/preS3Upload",
	                                dataType: "json",
	                                data: {},
	                                success: function(data) {
	                                    if (data.status === 'ok') {
	                                        s3Key = data.s3Key;
	                                        signedURL = data.signedURL;
	                                        signedGalleryURL = data.signedGalleryURL;
	                                        signedThumbnailURL = data.signedThumbnailURL;
	                                        fn(null);
	                                    } else {
	                                        fn("preS3Upload failed");
	                                    }
	                                },
	                                error: function(data, textStatus, errorThrown) {
	                                    fn("preS3Upload failed");
	                                }
	                            });
	                        };

	                        function _uploadProgress(e) {
	                            if (e.lengthComputable) {
	                                var complete = (e.loaded / e.total * 100 | 0);
	                                $progressBar.css('width', complete + '%');
	                                console.log('Uploading Original', complete);
	                            }

	                            if (!prepareGalleryImgPromise) {
	                                prepareGalleryImgPromise = prepareGalleryImgDeferred.promise();
	                                _downscaleImgAndEncryptInUint8Array(720, prepareGalleryImgDeferred);

	                                prepareGalleryImgPromise.done(function(data) {
	                                    totalUploadedSize += data.byteLength;
	                                    $.ajax({
	                                            type: 'PUT',
	                                            url: signedGalleryURL,
	                                            // Content type must much with the parameter you signed your URL with
	                                            contentType: 'binary/octet-stream',
	                                            // this flag is important, if not set, it will try to send data as a form
	                                            processData: false,
	                                            // the actual data is sent raw
	                                            data: data,
	                                            xhr: function() {
	                                                var myXhr = $.ajaxSettings.xhr();
	                                                galleryXhr = myXhr;
	                                                if (myXhr.upload) {
	                                                    myXhr.upload.addEventListener('progress', function(e) {
	                                                        if (e.lengthComputable) {
	                                                            var complete = (e.loaded / e.total * 100 | 0);
	                                                            console.log('Uploading Gallery', complete);
	                                                        }
	                                                    }, false);
	                                                }
	                                                return myXhr;
	                                            }
	                                        })
	                                        .success(function() {
	                                            console.log('Gallery uploading succeeded');
	                                            uploadGalleryImgDeferred.resolve();
	                                            galleryXhr = null;
	                                        })
	                                        .error(function(jqXHR, textStatus, errorThrown) {
	                                            console.log('Gallery uploading failed');
	                                            uploadGalleryImgDeferred.reject();
	                                            galleryXhr.abort();
	                                        });

	                                    prepareThumbnailImgPromise = prepareThumbnailImgDeferred.promise();
	                                    _downscaleImgAndEncryptInUint8Array(120, prepareThumbnailImgDeferred);
	                                    prepareThumbnailImgPromise.done(function(data) {
	                                        totalUploadedSize += data.byteLength;
	                                        $.ajax({
	                                                type: 'PUT',
	                                                url: signedThumbnailURL,
	                                                // Content type must much with the parameter you signed your URL with
	                                                contentType: 'binary/octet-stream',
	                                                // this flag is important, if not set, it will try to send data as a form
	                                                processData: false,
	                                                // the actual data is sent raw
	                                                data: data,
	                                                xhr: function() {
	                                                    var myXhr;
	                                                    myXhr = $.ajaxSettings.xhr();
	                                                    thumbnailXhr = myXhr;
	                                                    if (myXhr.upload) {
	                                                        myXhr.upload.addEventListener('progress', function(e) {
	                                                            if (e.lengthComputable) {
	                                                                var complete = (e.loaded / e.total * 100 | 0);
	                                                                console.log('Uploading Thumbnail', complete);
	                                                            }
	                                                        }, false);
	                                                    }
	                                                    return myXhr;
	                                                }
	                                            })
	                                            .success(function() {
	                                                console.log('Thumbnail uploading succeeded');
	                                                uploadThumbnailImgDeferred.resolve();
	                                                thumbnailXhr = null;
	                                            })
	                                            .error(function(jqXHR, textStatus, errorThrown) {
	                                                console.log('Thumbnail uploading failed');
	                                                uploadThumbnailImgDeferred.reject();
	                                                thumbnailXhr.abort();
	                                            });
	                                    });
	                                });
	                            }
	                        };

	                        function _downscaleImgAndEncryptInUint8Array(size, deferred) {
	                            _downScaleImage(imgDOM, exifOrientation, size, function(err, binaryString) {
	                                if (err) {
	                                    console.log(err);
	                                    deferred.reject();
	                                } else {
	                                    encryptDataInBinaryString(binaryString, function(err, encryptedImageDataInUint8Array) {
	                                        if (err) {
	                                            deferred.reject();
	                                        } else {
	                                            deferred.resolve(encryptedImageDataInUint8Array);
	                                        }
	                                    });
	                                }
	                            });
	                        };


	                        preS3Upload(function(err) {
	                            if (err) {
	                                fn(err);
	                            } else {
	                                totalUploadedSize += data.byteLength;
	                                $.ajax({
	                                        type: 'PUT',
	                                        url: signedURL,
	                                        // Content type must much with the parameter you signed your URL with
	                                        contentType: 'binary/octet-stream',
	                                        // this flag is important, if not set, it will try to send data as a form
	                                        processData: false,
	                                        // the actual data is sent raw
	                                        data: data,
	                                        xhr: function() {
	                                            originalXhr = $.ajaxSettings.xhr();
	                                            var myXhr = $.ajaxSettings.xhr();
	                                            originalXhr = myXhr;
	                                            if (myXhr.upload) {
	                                                myXhr.upload.addEventListener('progress', _uploadProgress, false);
	                                            }
	                                            return myXhr;
	                                        }
	                                    })
	                                    .success(function() {
	                                        var id = s3Key + "&" + imageWidth + "x" + imageHeight;
	                                        $img.attr('id', id);
	                                        id = $img.attr('id');
	                                        console.log("Original images was uploaded successfully");
	                                        uploadOriginalImgDeferred.resolve();
	                                        originalXhr = null;
	                                    })
	                                    .error(function(jqXHR, textStatus, errorThrown) {
	                                        uploadOriginalImgDeferred.reject();
	                                        originalXhr.abort();
	                                        console.log(errorThrown);
	                                    });
	                            }
	                        });

	                        $.when(uploadOriginalImgPromise, uploadGalleryImgPromise, uploadThumbnailImgPromise).done(function() {
	                            fn(null);
	                        }).fail(function() {
	                            fn('Uploading Original,  Gallery or Thumbnail failed');
	                            if (originalXhr) originalXhr.abort();
	                            if (galleryXhr) galleryXhr.abort();
	                            if (thumbnailXhr) thumbnailXhr.abort();
	                        });
	                    };

	                    function postS3Upload(fn) {
	                        var expandedKey;

	                        bSafesPreflight(function(err, key) {
	                            if (err) {
	                                alert(err);
	                            } else {
	                                expandedKey = key;
	                                var envelopeIV = forge.random.getBytesSync(16);
	                                var ivEnvelopeIV = forge.random.getBytesSync(16);
	                                var keyEnvelope = encryptBinaryString(itemKey, expandedKey, envelopeIV);
	                                var ivEnvelope = encryptBinaryString(itemIV, expandedKey, ivEnvelopeIV);

	                                $.ajax({
	                                    type: 'POST',
	                                    timeout: 7000,
	                                    url: "/memberAPI/postS3Upload",
	                                    dataType: "json",
	                                    data: {
	                                        "id": s3Key,
	                                        "itemId": itemId,
	                                        "keyEnvelope": keyEnvelope,
	                                        "ivEnvelope": ivEnvelope,
	                                        "envelopeIV": envelopeIV,
	                                        "ivEnvelopeIV": ivEnvelopeIV,
	                                        "size": s3ObjectSize
	                                    },
	                                    success: function(data) {
	                                        if (data.status === 'ok') {
	                                            fn(null);
	                                        } else {
	                                            fn("postS3Upload failed");
	                                        }
	                                    },
	                                    error: function(data, textStatus, errorThrown) {
	                                        fn("postS3Upload failed");
	                                    }
	                                });
	                            }
	                        });
	                    };

	                    function encryptDataInBinaryString(data, fn) {
	                        var binaryStr = data;
	                        console.log('encrypting', binaryStr.length);
	                        var encryptedStr = encryptLargeBinaryString(binaryStr, itemKey, itemIV);
	                        //console.log('decrypting', encryptedStr.length);
	                        //var decryptedStr = decryptLargeBinaryString(encryptedStr, itemKey, itemIV);
	                        var uint8Array = convertBinaryStringToUint8Array(encryptedStr);
	                        fn(null, uint8Array);
	                    };

	                    encryptDataInBinaryString(imageDataInBinaryString, function(err, encryptedImageDataInUint8Array) {
	                        if (err) {
	                            console.log("encryptDataInBinaryString failed");
	                            doneUploadingAnImage("encryptDataInBinaryString failed");
	                        } else {
	                        	//encrypted_buffer = encryptedImageDataInUint8Array;
	                        	encrypted_buffer = Utf8ArrayToStr(encryptedImageDataInUint8Array, 1000);
	                            $uploadImage.find('.uploadText').text("Uploading");
	                            uploadToS3(encryptedImageDataInUint8Array, function(err) {
	                                if (err) {
	                                    doneUploadingAnImage('uploadToS3:' + err);
	                                } else {
	                                    console.log("Done uploading an image");
	                                    s3ObjectSize = encryptedImageDataInUint8Array.byteLength;
	                                    postS3Upload(function(err) {
	                                        if (err) {
	                                            doneUploadingAnImage(err);
	                                        } else {
	                                            var id = $uploadImage.attr('id');
	                                            var index = id.split('-')[1];

	                                            var id = $uploadImage.attr('id');
	                                            var $imagePanel = $('.imagePanelTemplate').clone().removeClass('imagePanelTemplate hidden').addClass('imagePanel');
	                                            $imagePanel.find('.deleteImageBtn').attr('data-key', s3Key).on('click', pageControlFunctions.deleteImageOnPage);
	                                            $imagePanel.attr('id', id);
	                                            $img.data('width', $img[0].width);
	                                            $img.data('height', $img[0].height);
	                                            $img.on('click', function(e) {
	                                                $thisImg = $(e.target);
	                                                $thisImagePanel = $thisImg.closest('.imagePanel');
	                                                var index = $thisImagePanel.attr('id');
	                                                var startingIndex = parseInt(index.split('-')[1]);
	                                                showGallery(startingIndex);
	                                            });
	                                            $imagePanel.find('.image').append($img);
	                                            $imagePanel.find('.btnWrite').on('click', handleBtnWriteClicked);
	                                            $imagePanel.find('.insertImages').on('change', insertImages);
	                                            $uploadImage.before($imagePanel);
	                                            $uploadImage.remove();
	                                            doneUploadingAnImage(null);
	                                        }
	                                    });
	                                }
	                            });
	                        }
	                    });
	                };

	                function doneUploadingAnImage(err) {
	                    if (err) {
	                        alert("Ooh, please retry!");
	                        $progressBar.css('width', '0%');
	                        uploadAnImage($uploadImage);
	                    } else {
	                        var image = { s3Key: s3Key, size: totalUploadedSize };
	                        uploadedImages.push(image);
	                        index++;
	                        if (index < numberOfUploads) {
	                            uploadAnImage($($uploadImagesList[index]));
	                        } else {
	                            doneUploadingImages(null);
	                        }
	                    }
	                };

	                var file = $uploadImage.data('file');
	                var reader = new FileReader();

	                reader.addEventListener('load', function() {
	                    var imageData = reader.result;

	                    function getOrientation(data) {
	                        var view = new DataView(imageData);

	                        if (view.getUint16(0, false) != 0xFFD8) return -2;

	                        var length = view.byteLength,
	                            offset = 2;
	                        while (offset < length) {
	                            var marker = view.getUint16(offset, false);
	                            offset += 2;
	                            if (marker == 0xFFE1) {

	                                if (view.getUint32(offset += 2, false) != 0x45786966) return -1;

	                                var little = view.getUint16(offset += 6, false) == 0x4949;
	                                offset += view.getUint32(offset + 4, little);
	                                var tags = view.getUint16(offset, little);
	                                offset += 2;
	                                for (var i = 0; i < tags; i++)
	                                    if (view.getUint16(offset + (i * 12), little) == 0x0112)
	                                        return view.getUint16(offset + (i * 12) + 8, little);
	                            } else if ((marker & 0xFF00) != 0xFF00) break;
	                            else offset += view.getUint16(offset, false);
	                        }
	                        return -1;
	                    };

	                    exifOrientation = getOrientation(imageData);

	                    var imageDataInUint8Array = new Uint8Array(imageData);
	                    var blob = new Blob([imageDataInUint8Array], { type: 'image/jpeg' });
	                    link = window.URL.createObjectURL(blob);

	                    rotateImage(link, exifOrientation, function(err, blob, binaryString) {
	                        if (err) {
	                            console.log('Rotation Error');
	                            alert(err);
	                        }
	                        console.log('Rotation done');
	                        imageDataInBinaryString = binaryString;
	                        link = window.URL.createObjectURL(blob);

	                        $img = $('<img class="img-responsive" src="' + link + '"' + '>');
	                        $img.on('load', startUploadingAnImage);
	                    });

	                }, false);

	                reader.readAsArrayBuffer(file);
	            }

	            uploadAnImage($($uploadImagesList[index]));
	        };

	        uploadingImages(function(err) {
	            console.log(uploadedImages);
	            setStatusLen();
	            if (uploadedImages.length) {
	                var originalImages = itemCopy.images;

	                switch (mode) {
	                    case 'appendToTheFront':
	                        if (originalImages && originalImages.length) {
	                            var newImages = uploadedImages.concat(originalImages);
	                            itemCopy.images = newImages;
	                        } else {
	                            itemCopy.images = uploadedImages;
	                        }
	                        break;
	                    case 'insert':
	                        var args = [insertIndex + 1, 0].concat(uploadedImages);
	                        Array.prototype.splice.apply(originalImages, args);
	                        itemCopy.images = originalImages;
	                        break;
	                    case 'appendToTheEnd':
	                        var newImages = originalImages.concat(uploadedImages);
	                        itemCopy.images = newImages;
	                        break;
	                    default:
	                };
	                itemCopy.update = "images";
	                createNewItemVersionForPage();
	            };
	            if (err) {
	                console.log(err);
	            } else {

	            }
	        });
	    };

	    setStatusLock();

	    switch (mode) {
	        case 'appendToTheFront':
	            var $imagePanels = $('.imagePanel');
	            insertIndex = -1;
	            if ($imagePanels.length) {} else {
	                if (isBlankPageItem) {}
	            }
	            break;
	        case 'insert':
	            var imagePanelId = $imagePanel.attr('id');
	            imagePanelIdParts = imagePanelId.split('-');
	            insertIndex = parseInt(imagePanelIdParts[1]);
	            break;
	        case 'appendToTheEnd':
	            var imagePanelId = $imagePanel.attr('id');
	            imagePanelIdParts = imagePanelId.split('-');
	            insertIndex = parseInt(imagePanelIdParts[1]);
	            break;
	        default:
	    };

	    if (isBlankPageItem) {
	        if (itemContainer.substring(0, 1) === 'f') {
	            var addActionOptions = {
	                "targetContainer": itemContainer,
	                "targetItem": itemId,
	                "targetPosition": itemPosition,
	                "type": 'Page',
	                "keyEnvelope": keyEnvelope,
	                "ivEnvelope": ivEnvelope,
	                "envelopeIV": envelopeIV,
	                "ivEnvelopeIV": ivEnvelopeIV
	            }
	            $.post('/memberAPI/addAnItemAfter',
	                addActionOptions,
	                function(data, textStatus, jQxhr) {
	                    if (data.status === 'ok') {
	                        itemCopy = data.item;
	                        setCurrentVersion(itemCopy.version);
	                        var item = data.item;
	                        itemId = item.id;
	                        itemPosition = item.position;
	                        setupContainerPageKeyValue('itemId', itemId);
	                        setupContainerPageKeyValue('itemPosition', itemPosition);
	                        isBlankPageItem = false;
	                        var $thisImagePanel = $imagePanel;
	                        buildUploadImageElements($thisImagePanel);
	                        startUploadingImages();
	                    }
	                }, 'json');
	        } else if (itemContainer.substring(0, 1) === 'n') {
	            $.post('/memberAPI/createANotebookPage', {
	                "itemId": itemId,
	                "keyEnvelope": keyEnvelope,
	                "ivEnvelope": ivEnvelope,
	                "envelopeIV": envelopeIV,
	                "ivEnvelopeIV": ivEnvelopeIV
	            }, function(data, textStatus, jQxhr) {
	                if (data.status === 'ok') {
	                    itemCopy = data.item;
	                    setCurrentVersion(itemCopy.version);
	                    isBlankPageItem = false;
	                    var $thisImagePanel = $imagePanel;
	                    buildUploadImageElements($thisImagePanel);
	                    startUploadingImages();
	                }
	            }, 'json');
	        } else if (itemContainer.substring(0, 1) === 'd') {
	            $.post('/memberAPI/createADiaryPage', {
	                "itemId": itemId,
	                "keyEnvelope": keyEnvelope,
	                "ivEnvelope": ivEnvelope,
	                "envelopeIV": envelopeIV,
	                "ivEnvelopeIV": ivEnvelopeIV
	            }, function(data, textStatus, jQxhr) {
	                if (data.status === 'ok') {
	                    itemCopy = data.item;
	                    setCurrentVersion(itemCopy.version);
	                    isBlankPageItem = false;
	                    var $thisImagePanel = $imagePanel;
	                    buildUploadImageElements($thisImagePanel);
	                    startUploadingImages();
	                }
	            }, 'json');
	        }
	    } else {
	        buildUploadImageElements($imagePanel);
	        startUploadingImages();
	    }
	}

	function initializeImageButton() {
	    var $imageBtnRow = $('.imageBtnRowTemplate').clone().removeClass('imageBtnRowTemplate hidden').addClass('imageBtnRow');
	    $('.images').prepend($imageBtnRow);
	    $imageBtnRow.find('#image').on('change', function(e) {
	        e.preventDefault();
	        var files = e.target.files;
	        if (files.length) {
	            uploadImages(files, 'appendToTheFront');
	        }
	    });

	    // added by <Said M> for issue #25
	    //define drag & drop dev for drag & drop multi files.
	    $imageBtnRow.css("padding", "0 30px");
		var $imageDragDropDiv = $imageBtnRow.find('div');
	    $imageDragDropDiv.css("border", '2px dashed #e4e1e1')
					    .css("background-color", 'aliceblue')
						.css("margin-bottom", '10px');
	    // $imageDragDropDiv.append('<p>Choose gallery images or drag it here.</p>');

		$imageDragDropDiv.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
	        e.preventDefault();
	        e.stopPropagation();
	    })
	    .on('dragover dragenter', function() {
	        $imageDragDropDiv.css("background-color", 'white');
	    })
	    .on('dragleave dragend drop', function() {
	        $imageDragDropDiv.css("background-color", 'aliceblue');
	    })
	    .on('drop', function(e) {
	        $imageDragDropDiv.css("background-color", 'aliceblue');
	        droppedFiles = e.originalEvent.dataTransfer.files;
	        uploadImages(droppedFiles, 'appendToTheFront');
	    });
	    // ended by <Said M> for issue #25
	    
	}

	function initializeAttachButton() {
	    var $attachBtnRow = $('.attachBtnRowTemplate').clone().removeClass('attachBtnRowTemplate hidden').addClass('attachBtnRow');
	    $('.attachments').prepend($attachBtnRow);
	    $attachBtnRow.find('#attach').on('change', function(e) {
	        e.preventDefault();
	        var files = e.target.files;
	        for (var i = 0; i < files.length; i++) {
	            var file = files[i];
	            var $attachment = showAttachment(file.name, file.size);
	            $attachment.data('file', file);
	            changeUploadingState($attachment, "Pending");

	            queueUploadAttachment($attachment);
	        }
	    });

	    // added by <Said M> for issue #25
	    //define drag & drop dev for drag & drop multi files.
	    $attachBtnRow.css("padding", "0 30px");
	    var $attachDragDropDiv = $attachBtnRow.find('div');	    
	    $attachDragDropDiv.css("border", '2px dashed #e4e1e1')
						    .css("background-color", 'blanchedalmond')
						    .css("margin-top", '10px')
		$attachDragDropDiv.css("margin-bottom", '10px');
		// $attachDragDropDiv.append('<p>Choose attatching files or drag it here.</p>');

		$attachDragDropDiv.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
	        e.preventDefault();
	        e.stopPropagation();
	    })
	    .on('dragover dragenter', function() {
	        $attachDragDropDiv.css("background-color", 'white');
	    })
	    .on('dragleave dragend drop', function() {
	        $attachDragDropDiv.css("background-color", 'blanchedalmond');
	    })
	    .on('drop', function(e) {
	        $attachDragDropDiv.css("background-color", 'blanchedalmond');
	        droppedFiles = e.originalEvent.dataTransfer.files;
	        for (var i = 0; i < droppedFiles.length; i++) {
	            var file = droppedFiles[i];
	            var $attachment = showAttachment(file.name, file.size);
	            $attachment.data('file', file);
	            changeUploadingState($attachment, "Pending");

	            queueUploadAttachment($attachment);
	        }
	    });
	    // ended by <Said M> for issue #25
	}

	function isImageDisplayed(imageElement) {
	    var src = imageElement.attr('src');
	    return src.indexOf('blob:') === 0;
	};

	function attachProgressBar($downloadElement, downloading) {
	    var id = $downloadElement.attr('id');
	    var $downloadElementCopy = $downloadElement.clone(true);
	    var $downloadingContainer = $('<div style="position:relative"></div>');
	    if ($downloadElementCopy.hasClass('bSafesImage')) {
	        $downloadingContainer.addClass('downloadingImageContainer');
	    } else {
	        $downloadingContainer.addClass('downloadingVideoContainer');
	    }

	    $downloadingContainer.append($downloadElementCopy);
	    var $progress = $('<div class="progress" style="position:absolute"><div class="progress-bar" style="width: 0%"></div></div>');
	    $progress.find('.progress-bar').attr('id', 'progressBar' + id);
	    $downloadElement.replaceWith($downloadingContainer);

	    function alignProgressPosition() {
	        var imageWidth = $downloadElementCopy.width();
	        var imageHeight = $downloadElementCopy.height();
	        var position = $downloadElementCopy.position();
	        var downloadingContainerWidth = $downloadingContainer.width();
	        var imageLeft = position.left;
	        var leftPercent = (((downloadingContainerWidth - imageWidth) / 2) / downloadingContainerWidth) * 100;
	        $progress.css('width', imageWidth);
	        $progress.css('top', imageHeight);
	        if ($downloadElementCopy.hasClass('fr-fil')) {
	            $progress.css('margin-left', 0);
	        } else if ($downloadElementCopy.hasClass('fr-fir')) {
	            $progress.css('right', 0);
	        } else if ($downloadElementCopy.hasClass('fr-dib')) {
	            $progress.css('margin-left', leftPercent + '%');
	        } else if ($downloadElementCopy.hasClass('fr-dii')) {
	            $progress.css('margin-left', 5);
	        }
	    }

	    if (downloading) {
	        alignProgressPosition();
	        $downloadingContainer.append($progress);
	        $downloadElementCopy.off();
	    } else {
	        $downloadElementCopy.load(function() {
	            // Once the dummy encrypted image is loaded
	            alignProgressPosition();
	            $downloadingContainer.append($progress);
	            $downloadElementCopy.off();
	        });
	    }

	    window.onresize = function(event) {
	        alignProgressPosition();
	    };
	}

	function downloadContentImageObjects() {
	    downloadNextContentImageObject();
	};

	function downloadNextContentImageObject() {
	    var encryptedImages = $('.bSafesImage');
	    if (encryptedImages.length === 0) return;
	    for (var i = 0; i < encryptedImages.length; i++) {
	        if ($(encryptedImages[i]).hasClass('bSafesDownloading')) continue;
	        if ($(encryptedImages[i]).hasClass('bSafesDisplayed')) continue;
	        if (isImageDisplayed($(encryptedImages[i]))) continue;
	        break;
	    }
	    if (i < encryptedImages.length) downloadImageObject($(encryptedImages[i]));
	};

	function downloadImageObject(encryptedImageElement) {
	    currentDownloadingImageElement = encryptedImageElement;
	    currentDownloadingImageElement.addClass('bSafesDownloading');

	    var id = currentDownloadingImageElement.attr('id');

	    if (!currentEditor) {
	        attachProgressBar(currentDownloadingImageElement);
	    }

	    var s3CommonKey = id.split('&')[0];
	    var s3Key = s3CommonKey + '_gallery';

	    function displayImage(link) {
	        var targetElement = $(document.getElementById(id)); // jQuery doesn't accept slashes in selector
	        targetElement.load(function() {
	            targetElement.addClass('bSafesDisplayed');
	            var parent = targetElement.parent();
	            if (parent.hasClass('downloadingImageContainer')) parent.replaceWith(targetElement);
	            downloadNextContentImageObject();
	        });
	        targetElement.attr('src', link);
	    }

	    $.post('/memberAPI/preS3Download', {
	        itemId: itemId,
	        s3Key: s3Key
	    }, function(data, textStatus, jQxhr) {
	        if (data.status === 'ok') {
	            var signedURL = data.signedURL;

	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', signedURL, true);
	            xhr.responseType = 'arraybuffer';

	            xhr.addEventListener("progress", function(evt) {
	                if (evt.lengthComputable) {
	                    var percentComplete = evt.loaded / evt.total * 100;

	                    console.log(percentComplete);
	                    $(document.getElementById('progressBar' + id)).width(percentComplete + '%');
	                }
	            }, false);

	            xhr.onload = function(e) {
	                var encryptedImageDataInArrayBuffer = this.response;
	                $(document.getElementById('progressBar' + id)).parent().remove();
	                $.post('/memberAPI/postS3Download', {
	                    itemId: itemId,
	                    s3Key: s3CommonKey
	                }, function(data, textStatus, jQxhr) {
	                    if (data.status === 'ok') {
	                        var item = data.item;
	                        var size = item.size;

	                        var decryptedImageDataInUint8Array = decryptArrayBuffer(encryptedImageDataInArrayBuffer, itemKey, itemIV);
	                        var link = window.URL.createObjectURL(new Blob([decryptedImageDataInUint8Array]), { type: 'image/jpeg' });
	                        $downloadedElement = $(document.getElementById(id));
	                        $downloadedElement.removeClass('bSafesDownloading');
	                        displayImage(link);
	                    }
	                }, 'json');
	            };

	            xhr.send();

	        }
	    }, 'json');
	}

	function downloadVideoObject($videoDownload) {
	    $videoDownload.off('click');
	    $videoDownload.addClass('bSafesDownloading');
	    var id = $videoDownload.attr('id');
	    var s3Key = $videoDownload.attr('id').split('&')[0];

	    if (!currentEditor) {
	        attachProgressBar($videoDownload);
	    }

	    $.post('/memberAPI/preS3Download', {
	        itemId: itemId,
	        s3Key: s3Key
	    }, function(data, textStatus, jQxhr) {
	        if (data.status === 'ok') {
	            var signedURL = data.signedURL;

	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', signedURL, true);
	            xhr.responseType = 'arraybuffer';

	            xhr.addEventListener("progress", function(evt) {
	                if (evt.lengthComputable) {
	                    var percentComplete = evt.loaded / evt.total * 100;

	                    console.log(percentComplete);
	                    $(document.getElementById('progressBar' + id)).width(percentComplete + '%');
	                }
	            }, false);

	            xhr.onload = function(e) {
	                $(document.getElementById('progressBar' + id)).parent().remove();
	                var encryptedVideoDataInArrayBuffer = this.response;

	                decryptArrayBufferAsync(encryptedVideoDataInArrayBuffer, itemKey, itemIV, function(data) {
	                    videoBlob = new Blob([data], { type: "video/mp4" });
	                    videoLink = window.URL.createObjectURL(videoBlob);

	                    var $videoSpan = $('<span class="fr-video fr-draggable" contenteditable="false" draggable="true"><video class="bSafesVideo fr-draggable fr-dvi fr-fvc" controls="">Your browser does not support HTML5 video.</video></span>');
	                    var $video = $videoSpan.find('video');
	                    $video.attr('id', id);
	                    $video.attr('src', videoLink);
	                    var style = $videoDownload.attr('style');
	                    $video.attr('style', style);

	                    if ($videoDownload.hasClass('fr-dib')) $videoSpan.addClass('fr-dvb');
	                    if ($videoDownload.hasClass('fr-dii')) $videoSpan.addClass('fr-dvi');
	                    if ($videoDownload.hasClass('fr-fil')) $videoSpan.addClass('fr-fvl');
	                    if ($videoDownload.hasClass('fr-fic')) $videoSpan.addClass('fr-fvc');
	                    if ($videoDownload.hasClass('fr-fir')) $videoSpan.addClass('fr-fvr');

	                    var $targetElement = $(document.getElementById(id)); // jQuery doesn't accept slashes in selector
	                    var $parent = $targetElement.parent();
	                    $parent.replaceWith($videoSpan);

	                });
	            };

	            xhr.send();

	        }
	    }, 'json');
	};

	function handleVideoObjects() {
	    var videoDownloads = $('.bSafesDownloadVideo');
	    $('.bSafesDownloadVideo').on('click', function() {
	        downloadVideoObject($(this));
	    });
	}

	function cleanPageItem() {
	    itemCopy = null;
	    $('#tagsInput').off();
	    $('#confirmTagsInputBtn').off();
	    $('#cancelTagsInputBtn').off();
	    $('.imageBtnRow').remove();
	    $('.attachBtnRow').remove();
	    $('.btnWrite').off();
	    $('.btnSave').off();
	    $('.btnCancel').off();
	    $('#tagsInput').tokenfield('setTokens', []);
	    $('.froala-editor').html('');
	    $('.uploadImage').remove();
	    $('.downloadImage').remove();
	    $('.imagePanel').remove();
	    $('.attachment').remove();
	    $('.comment').remove();
	    $('.imageBtnRow').removeClass('hidden')
	}

	function getPageItem(thisItemId, thisExpandedKey, thisPrivateKey, thisSearchKey, done, thisVersion) {
	    oldVersion = "undefined"
	    if (!thisVersion) {
	        expandedKey = thisExpandedKey;
	        privateKey = thisPrivateKey;
	        searchKey = thisSearchKey;
	        itemId = thisItemId;
	    }

	    if (currentImageDownloadXhr) currentImageDownloadXhr.abort();
	    showLoadingPage();

	    function displayComments(comments) {
	        for (var i = 0; i < comments.length; i++) {
	            var $comment = $('.commentTemplate').clone().removeClass('commentTemplate hidden').addClass('comment');
	            var id = comments[i]._id;
	            $comment.data("id", id);
	            var comment = comments[i]._source;
	            var writerId = comment.writerId;
	            var myId = $('.loginUserId').text();
	            if (writerId === myId) {
	                var writerName = "You";
	                $comment.find('.btnWrite').on('click', handleBtnWriteClicked);
	            } else {
	                var writerName = comment.writerName;
	                $comment.find('.btnWrite').addClass("hidden othersComment");
	            }
	            writerName = DOMPurify.sanitize(writerName);
	            var creationTime = "Created, " + formatTimeDisplay(comment.creationTime);
	            id = "comment-" + i;
	            $comment.attr('id', id);
	            $comment.find('.btnWrite').attr('id', id);
	            $comment.find('.fa-pencil').attr('id', id);
	            $comment.find('.froala-editor').attr('id', id);
	            $comment.find('.commentWriterName').html(writerName);
	            $comment.find('.commentCreationTime').html(creationTime);
	            if (comment.lastUpdateTime !== comment.creationTime) {
	                var lastUpdateTime = "Updated, " + formatTimeDisplay(comment.lastUpdateTime);
	                $comment.find('.commentLastUpdateTime').html(lastUpdateTime);
	                $comment.find('.commentLastUpdateTimeRow').removeClass('hidden');
	            }
	            var encodedContent = decryptBinaryString(comment.content, itemKey, itemIV);
	            var content = forge.util.decodeUtf8(encodedContent);
	            content = DOMPurify.sanitize(content);
	            $comment.find('.froala-editor').html(content);
	            var $commentsSearchResults = $('.commentsSearchResults');
	            
	            $commentsSearchResults.append($comment);
	        }
	    };

	    function getPageComments() {
	        $.post('/memberAPI/getPageComments', {
	            itemId: itemId,
	            size: 10,
	            from: 0
	        }, function(data, textStatus, jQxhr) {
	        	$('.commentsSearchResults').removeClass('loading col-xs-12 col-xs-offset-0 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2');
	            if (data.status === "ok") {	            	
	                var total = data.hits.total;
	                var hits = data.hits.hits;
	                if (hits.length) displayComments(hits);
	            }
	        });
	    };

	    var options = { itemId: itemId };
	    if (thisVersion) {
	        options.oldVersion = thisVersion;
	    }
	    $.post('/memberAPI/getPageItem',
	        options,
	        function(data, textStatus, jQxhr) {
	            if (data.status === 'ok') {
	                cleanPageItem();
	                initializePageControls();
	                if (data.item) {
	                    postGetItemData(data.item);
	                    itemCopy = data.item;
	                    if (!thisVersion) {
	                        setCurrentVersion(itemCopy.version);
	                    } else {
	                        setOldVersion(thisVersion);
	                    }
	                    isBlankPageItem = false;
	                    $('#nextPageBtn, #previousPageBtn').removeClass('hidden');
	                    //console.log(data.item);

	                    var item = data.item;

	                    itemSpace = item.space;
	                    initCurrentSpace(itemSpace);
	                    itemContainer = item.container;
	                    itemPosition = item.position;

	                    function decryptItem(envelopeKey) {
							if((item.keyEnvelope === undefined) || (item.envelopeIV === undefined) || (item.ivEnvelope === undefined) || (item.ivEnvelopeIV === undefined)) {
								getAndShowPath(itemId, envelopeKey, teamName, "");
								done("Error: undefined item key");
							}
	                        itemKey = decryptBinaryString(item.keyEnvelope, envelopeKey, item.envelopeIV);
	                        itemIV = decryptBinaryString(item.ivEnvelope, envelopeKey, item.ivEnvelopeIV);
	                        itemTags = [];
	                        if (item.tags && item.tags.length > 1) {
	                            var encryptedTags = item.tags;
	                            for (var i = 0; i < (item.tags.length - 1); i++) {
	                                try {
	                                    var encryptedTag = encryptedTags[i];
	                                    var encodedTag = decryptBinaryString(encryptedTag, itemKey, itemIV);
	                                    var tag = forge.util.decodeUtf8(encodedTag);
	                                    
	                                    if (tag == constContentTypeWrite) {
	                                    	pageContentType = tag;
	                                    } else if (tag == constContentTypeDraw) {
	                                    	pageContentType = tag;
	                                    } else if (tag == constContentTypeSpreadsheet) {
	                                    	pageContentType = tag;
	                                    } else if (tag == constContentTypeDoc) {
	                                    	pageContentType = tag;
	                                    } else if (tag == constContentTypeMxGraph) {
	                                    	pageContentType = tag;
	                                    } else {
	                                    	itemTags.push(tag);
	                                    }
	                                } catch (err) {
	                                    alert(err);
	                                }
	                            }
	                            $('#tagsInput').tokenfield('setTokens', itemTags);
	                        };

	                        if (pageContentType == null) {
	                        	pageContentType = constContentTypeWrite;
	                        }
	                        //pageLocalStorageKey = itemId + pageContentType;
	                        //console.log('pageLocalStorageKey', pageLocalStorageKey);

	                        if (!thisVersion) {
	                            initializeTagsInput();
	                        } else {
	                            disableTagsInput();
	                        }

	                        $('.container').data('itemId', itemId);
	                        $('.container').data('itemKey', itemKey);
	                        $('.container').data('itemIV', itemIV);
	                        var titleText = "";
	                        if (item.title) {
	                            try {
	                                var encodedTitle = decryptBinaryString(item.title, itemKey, itemIV);
	                                title = forge.util.decodeUtf8(encodedTitle);
	                                title = DOMPurify.sanitize(title);
	                                $('.froala-editor#title').html(title);
	                                titleText = document.title = $(title).text();
	                            } catch (err) {
	                                alert(err);
	                            }
	                        } else {
	                            $('.froala-editor#title').html('<h2></h2>');
	                        }
	                        $('.froala-editor#title').removeClass('loading');

	                        getAndShowPath(itemId, envelopeKey, teamName, titleText);

	                        var content = null;
	                        if (item.content) {
	                            try {
	                                var encodedContent = decryptBinaryString(item.content, itemKey, itemIV);
	                                content = forge.util.decodeUtf8(encodedContent);
	                                DOMPurify.addHook('afterSanitizeAttributes', function(node) {
	                                    // set all elements owning target to target=_blank
	                                    if ('target' in node) {
	                                        node.setAttribute('target', '_blank');
	                                    }
	                                    // set non-HTML/MathML links to xlink:show=new
	                                    if (!node.hasAttribute('target') &&
	                                        (node.hasAttribute('xlink:href') ||
	                                            node.hasAttribute('href'))) {
	                                        node.setAttribute('xlink:show', 'new');
	                                    }
	                                });
	                                //content = DOMPurify.sanitize(content);
	                                if (pageContentType != constContentTypeMxGraph) {
	                                	content = DOMPurify.sanitize(content);	
	                                }	                                
	                                $('.froala-editor#content').removeClass('loading');

	                                
	                            } catch (err) {
	                                alert(err);
	                            }
	                            downloadContentImageObjects();
	                            handleVideoObjects();	                            
	                            
	                        } 

	                        if (item.images && item.images.length) {
	                            function downloadAndDisplayImages() {
	                                $('.imageBtnRow').addClass('hidden');

	                                function buildDownloadImagesList() {
	                                    var images = item.images;
	                                    var $lastElement = $('.imageBtnRow');
	                                    for (var i = 0; i < images.length; i++) {
	                                        $downloadImage = $('.downloadImageTemplate').clone().removeClass('downloadImageTemplate hidden').addClass('downloadImage');
	                                        var id = 'index-' + i;
	                                        $downloadImage.attr('id', id);
	                                        var s3Key = images[i].s3Key;
	                                        var words = images[i].words;
	                                        $downloadImage.data('s3Key', s3Key);
	                                        $downloadImage.data('words', words);
	                                        $downloadImage.find('.downloadText').text("");
	                                        $lastElement.after($downloadImage);
	                                        $lastElement = $downloadImage;
	                                    }
	                                };

	                                function startDownloadingImages(done) {
	                                    var $downloadImagesList = $('.downloadImage');
	                                    var index = 0;

	                                    function downloadAnImage(done) {
	                                        $downloadImage = $($downloadImagesList[index]);
	                                        $downloadImage.find('.downloadText').text("Downloading");
	                                        var id = $downloadImage.attr('id');
	                                        var s3CommonKey = $downloadImage.data('s3Key');
	                                        var s3Key = s3CommonKey + "_gallery";

	                                        $.post('/memberAPI/preS3Download', {
	                                            itemId: itemId,
	                                            s3Key: s3Key
	                                        }, function(data, textStatus, jQxhr) {
	                                            if (data.status === 'ok') {
	                                                var signedURL = data.signedURL;

	                                                var xhr = new XMLHttpRequest();
	                                                xhr.open('GET', signedURL, true);
	                                                xhr.responseType = 'arraybuffer';

	                                                xhr.addEventListener("progress", function(evt) {
	                                                    if (evt.lengthComputable) {
	                                                        var percentComplete = evt.loaded / evt.total * 100;
	                                                        $downloadImage.find('.progress-bar').css('width', percentComplete + '%');
	                                                    }
	                                                }, false);

	                                                xhr.onload = function(e) {
	                                                    $downloadImage.find('.downloadText').text("Decrypting");
	                                                    currentImageDownloadXhr = null;
	                                                    var encryptedImageDataInArrayBuffer = this.response;
	                                                    $.post('/memberAPI/postS3Download', {
	                                                        itemId: itemId,
	                                                        s3Key: s3CommonKey
	                                                    }, function(data, textStatus, jQxhr) {
	                                                        if (data.status === 'ok') {
	                                                            var item = data.item;
	                                                            var size = item.size;

	                                                            var decryptedImageDataInUint8Array = decryptArrayBuffer(encryptedImageDataInArrayBuffer, itemKey, itemIV);
	                                                            var link = window.URL.createObjectURL(new Blob([decryptedImageDataInUint8Array]), { type: 'image/jpeg' });
	                                                            $img = $('<img class="img-responsive" src="' + link + '"' + '>');
	                                                            $img.on('load', function(e) {
	                                                                var $thisImg = $(e.target);
	                                                                $thisImg.data('width', $thisImg[0].width);
	                                                                $thisImg.data('height', $thisImg[0].height);

	                                                                var $imagePanel = $('.imagePanelTemplate').clone().removeClass('imagePanelTemplate hidden').addClass('imagePanel');
	                                                                $imagePanel.find('.deleteImageBtn').attr('data-key', s3CommonKey).on('click', pageControlFunctions.deleteImageOnPage);
	                                                                $imagePanel.attr('id', id);
	                                                                $imagePanel.find('.image').append($thisImg);
	                                                                var encryptedWords = $downloadImage.data('words');
	                                                                if (encryptedWords) {
	                                                                    var encodedWords = decryptBinaryString(encryptedWords, itemKey, itemIV);
	                                                                    var words = forge.util.decodeUtf8(encodedWords);
	                                                                    words = DOMPurify.sanitize(words);
	                                                                    $imagePanel.find('.froala-editor').html(words);
	                                                                }
	                                                                $imagePanel.find('.btnWrite').on('click', handleBtnWriteClicked);
	                                                                $imagePanel.find('.insertImages').on('change', insertImages);
	                                                                $downloadImage.before($imagePanel);
	                                                                $downloadImage.remove();

	                                                                done(null);
	                                                            });
	                                                            $img.on('click', function(e) {
	                                                                $thisImg = $(e.target);
	                                                                $thisImagePanel = $thisImg.closest('.imagePanel');
	                                                                var index = $thisImagePanel.attr('id');
	                                                                var startingIndex = parseInt(index.split('-')[1]);
	                                                                showGallery(startingIndex);
	                                                            });
	                                                        }
	                                                    }, 'json');

	                                                };

	                                                xhr.send();
	                                                currentImageDownloadXhr = xhr;

	                                            }
	                                        }, 'json');

	                                    };

	                                    var doneDownloadingAnImage = function(err) {
	                                        if (err) {
	                                            console.log(err);
	                                            done(err);
	                                        } else {
	                                            index++;
	                                            if (index < $downloadImagesList.length) {
	                                                downloadAnImage(doneDownloadingAnImage);
	                                            } else {
	                                                done(null);
	                                            }
	                                        }
	                                    };

	                                    downloadAnImage(doneDownloadingAnImage);
	                                };

	                                buildDownloadImagesList();
	                                startDownloadingImages(function(err) {
	                                    if (err) {
	                                        console.log(err);
	                                    } else {
	                                        $('.imageBtnRow').removeClass('hidden');
	                                    }
	                                });

	                            };

	                            downloadAndDisplayImages();
	                        }

	                        var attachments = item.attachments;
	                        for (var i = 1; i < attachments.length; i++) {
	                            var attachment = attachments[i];
	                            var encodedFileName = decryptBinaryString(attachment.fileName, itemKey, itemIV);
	                            var fileName = forge.util.decodeUtf8(encodedFileName);
	                            var $attachment = showAttachment(fileName, attachment.size);
	                            $attachment.attr('id', attachment.s3KeyPrefix);
	                            changeDownloadingState($attachment, 'Attached');
	                            var $download = $attachment.find('.downloadBtn');
	                            $download.off();
	                            $download.click(queueDownloadEvent);
	                        }
	                        if (!thisVersion || thisVersion === currentVersion) {
	                            enableEditControls();
	                            /*initializeEditorButtons();
	                            initializeImageButton();
	                            initializeAttachButton();
	                            */
	                        } else {
	                            disableEditControls();
	                        }


		                	if (localStorage.getItem(itemId + constContentTypeWrite)) {
                            	pageLocalStorageKey = itemId + constContentTypeWrite;
                            } else if (localStorage.getItem(itemId + constContentTypeDraw)) {
                            	pageLocalStorageKey = itemId + constContentTypeDraw;
                            } else if (localStorage.getItem(itemId + constContentTypeSpreadsheet)) {
                            	pageLocalStorageKey = itemId + constContentTypeSpreadsheet;
                            } else if (localStorage.getItem(itemId + constContentTypeDoc)) {
                            	pageLocalStorageKey = itemId + constContentTypeDoc;
                            } else if (localStorage.getItem(itemId + constContentTypeMxGraph)) {
                            	pageLocalStorageKey = itemId + constContentTypeMxGraph;
                            } else {
                            	pageLocalStorageKey = null;
                            }

                            var flg = true;

	                        if (pageLocalStorageKey) {
                            	if (confirm('Found item contents in Local Storage.\nWould you like to recover the content from local storage?')) {
                            		flg = false;
							    	pageContentType = pageLocalStorageKey.replace(itemId, '');
							    	flgIsLoadingFromLocalStorage = true;
							    	//contentsFromServer = $('.froala-editor#content').html();
							    	contentsFromServer = content;

							    	//$('.froala-editor#content').html(localStorage.getItem(pageLocalStorageKey));							    	
								    console.log('load from localstorage', localStorage.getItem(pageLocalStorageKey));
								    console.log('pageContentType', pageContentType);
							    	initContentView(pageContentType, localStorage.getItem(pageLocalStorageKey));
							    	//$('.btnWrite.editControl#content').trigger( "click" );
								} else {
								    localStorage.removeItem(pageLocalStorageKey);								    
								}
                            }

                            if (flg) {
                            	if (!content || content == null) {
	                            	console.log('empty contents');	
	                            	addSelectContentTypeView();
	                            } else {
	                            	initContentView(pageContentType, content);
	                            }
                            }	
	                    }
	                    if (itemSpace.substring(0, 1) === 'u') {
	                        $('.navbarTeamName').text("Yours");
	                        decryptItem(expandedKey);
	                        getPageComments();
	                        done(null, item);
	                    } else {
	                        isATeamItem = true;
	                        var itemSpaceParts = itemSpace.split(':');
	                        itemSpaceParts.splice(-2, 2);
	                        teamId = itemSpaceParts.join(':');
	                        getTeamData(teamId, function(err, team) {
	                            if (err) {

	                            } else {
	                                var teamKeyEnvelope = team.teamKeyEnvelope;
	                                teamKey = pkiDecrypt(teamKeyEnvelope);
	                                var encryptedTeamName = team.team._source.name;
	                                var teamIV = team.team._source.IV;
	                                teamName = decryptBinaryString(encryptedTeamName, teamKey, teamIV);
	                                teamName = forge.util.decodeUtf8(teamName);
	                                teamName = DOMPurify.sanitize(teamName);

	                                if (teamName.length > 20) {
	                                    var displayTeamName = teamName.substr(0, 20);
	                                } else {
	                                    var displayTeamName = teamName;
	                                }

	                                $('.navbarTeamName').text(displayTeamName);

	                                var teamSearchKeyEnvelope = team.team._source.searchKeyEnvelope;
	                                var teamSearchKeyIV = team.team._source.searchKeyIV;

	                                teamSearchKey = decryptBinaryString(teamSearchKeyEnvelope, teamKey, teamSearchKeyIV);
	                                setIsATeamItem(teamKey, teamSearchKey);

	                                decryptItem(teamKey);
	                                getPageComments();
	                                done(null, item);
	                            }
	                        });
	                    }
	                } else {
	                    initializeTagsInput();
	                    setCurrentVersion(0);

	                    if ((itemId.substring(0, 2) === 'np') || (itemId.substring(0, 2) === 'dp')) {
	                        itemIdParts = itemId.split(':');

	                        if (itemId.substring(0, 2) === 'np') {
	                            itemContainer = 'n';
	                            itemPosition = Number(itemIdParts[itemIdParts.length - 1]);
	                        } else if (itemId.substring(0, 2) === 'dp') {
	                            itemContainer = 'd';
	                            var dateText = itemIdParts[itemIdParts.length - 1];
	                            dateText = dateText.replace(/-/g, "");
	                            itemPosition = Number(dateText);
	                        }
	                        for (var i = 1; i < itemIdParts.length - 1; i++) {
	                            itemContainer = itemContainer + ':' + itemIdParts[i];
	                        }
	                        setupContainerPageKeyValue('itemPosition', itemPosition);
	                        isBlankPageItem = true;
	                        getPath(itemContainer, itemId, function(itemPath) {
	                            itemSpace = itemPath[0]._id;
	                            initCurrentSpace(itemSpace);

	                            if (itemSpace.substring(0, 1) === 't') {
	                                isATeamItem = true;

	                                var itemSpaceParts = itemSpace.split(':');
	                                itemSpaceParts.splice(-2, 2);
	                                teamId = itemSpaceParts.join(':');
	                                getTeamData(teamId, function(err, team) {
	                                    if (err) {
	                                        done(err);
	                                    } else {
	                                        var teamKeyEnvelope = team.teamKeyEnvelope;
	                                        teamKey = pkiDecrypt(teamKeyEnvelope);
	                                        var encryptedTeamName = team.team._source.name;
	                                        var teamIV = team.team._source.IV;
	                                        teamName = decryptBinaryString(encryptedTeamName, teamKey, teamIV);
	                                        teamName = forge.util.decodeUtf8(teamName);
	                                        teamName = DOMPurify.sanitize(teamName);
	                                        var teamSearchKeyEnvelope = team.team._source.searchKeyEnvelope;
	                                        var teamSearchKeyIV = team.team._source.searchKeyIV;
	                                        teamSearchKey = decryptBinaryString(teamSearchKeyEnvelope, teamKey, teamSearchKeyIV);
	                                        $('.pathSpace').find('a').html(teamName);
	                                        showPath(teamName, itemPath, itemContainer, teamKey, itemId);

	                                        setupNewItemKey();
	                                        done(null, null);
	                                    }
	                                });
	                            } else {
	                                setupNewItemKey();
	                                showPath('Personal', itemPath, itemContainer, expandedKey, itemId);
	                                done(null, null);
	                            }
	                        });

	                        addSelectContentTypeView();
	                    } else {
	                        done(null, null);
	                    }
	                }
	            } else {
	                done(data.err)
	            }
	            hideLoadingPage();
	        }, 'json');
	};

	function initializePageControlsCallback(callbacks) {
	    if (callbacks.handleEditorStateChanged) editorStateChanged = callbacks.handleEditorStateChanged;
	    if (callbacks.setupContainerPageKeyValue) setupContainerPageKeyValue = callbacks.setupContainerPageKeyValue;
	    if (callbacks.pkiDecrypt) pkiDecrypt = callbacks.pkiDecrypt;
	    if (callbacks.setIsATeamItem) setIsATeamItem = callbacks.setIsATeamItem;
	};

	function initializePageControls() {
	    initializePageItemVersionsHistory();
	    initializeEditorButtons();
	    initializeImageButton();
	    initializeAttachButton();
	    addButtonLock();
	    addSnippet();
	    modifyPrevnextButton();
	    //backupContentsInLocalStorage();
	}

	function handleMoveAnItem(e) {
	    $(e.target).trigger('blur');
	    var isModalVisible = $('#moveAnItemModal').is(':visible');
	    if (!isModalVisible) {
	        showMoveAnItemModal(itemCopy, itemSpace);
	    }
	    return false;
	}

	function handleTrashAnItem(e) {
	    $(e.target).trigger('blur');
	    var isModalVisible = $('#trashAnItemModal').is(':visible');
	    if (!isModalVisible) {
	        showTrashAnItemModal(itemSpace, itemSpace);
	    }
	    return false;
	}

	var backupContentsInLocalStorage = function() {
		//console.log('backupContentsInLocalStorage, pageContentType', pageContentType);

	    if (pageContentType)
	    {
	    	var flg = true;
	    	if ( (pageContentType == constContentTypeWrite) && !editorContentsStatus ) {
	    		flg = false;
	    	}
	    	if (flg) {
	    		//var current_contents = currentEditor.froalaEditor('html.get');
		    	var current_contents = getCurrentContent();
		    	if ( (current_contents != null) && (lastContent != current_contents) ) {
		    		console.log('lastContent', lastContent);
		    		console.log('current_contents', current_contents);	
		    		pageLocalStorageKey = itemId + pageContentType;
		    		localStorage.setItem(pageLocalStorageKey, current_contents);
		    		lastContent = current_contents;	
		    	}
		    	//lastContent = current_contents;	  
	    	}
	    	  	
	    }
	    setTimeout(backupContentsInLocalStorage, 3000);
	}; 

	function addSelectContentTypeView()
	{		
		$('.btnWrite.editControl#content').after( html_selectContentType );
		
		$('.selectContentType').click(function(e) {
			$('#selectContentTypeModal').modal('show');
			return false;
		});
	}

	

	function addSelectContentTypeModal()
	{
		var htmlSelectContentTypeModal = `
			<div class="modal fade in" id="selectContentTypeModal" tabindex="-1" role="dialog" aria-labelledby="selectContentTypeModal" aria-hidden="true" style="display: none; padding-right: 17px;">
				<div class="modal-dialog">
					<div class="modal-content" style="overflow: hidden;">
						<div class="modal-header">
							<button type="button" class="close" id="closeSelectContentTypeModal" data-dismiss="modal" aria-hidden="true">×</button>
							<h4 class="modal-title" id="moveItemsModalLabel">Please Select a Type</h4>
						</div>
						<div class="modal-body" style="max-height: 336px; overflow-y: auto;">
							
							<div class="list-group containersList">
								<a href="#" class="list-group-item contentTypeItem contentTypeWrite">
									<em class="fontSize18Px">Write</em>
								</a>
								<a href="#" class="list-group-item contentTypeItem contentTypeDraw">
									<em class="fontSize18Px">Draw</em>
								</a>
								<a href="#" class="list-group-item contentTypeItem contentTypeSpreadsheet">
									<em class="fontSize18Px">Spreadsheet</em>
								</a>
								<a href="#" class="list-group-item contentTypeItem contentTypeDoc">
									<em class="fontSize18Px">Doc</em>
								</a>
								<a href="#" class="list-group-item contentTypeItem contentTypeMxGraph">
									<em class="fontSize18Px">Diagram</em>
								</a>
							</div>
						</div>
					</div>
				<!-- /.modal-content -->
				</div>
			<!-- /.modal-dialog -->
			</div>
		`;

		$(htmlSelectContentTypeModal).appendTo('body');

		$('.contentTypeItem').click(function(e) {
			$('#selectContentTypeModal').modal('hide');
			$('.selectContentType').addClass('hidden');

			var $contentTypeItem = $(e.target);

		    if ($contentTypeItem.hasClass('contentTypeWrite')) {
		    	pageContentType = constContentTypeWrite;
		    	$('.btnWrite.editControl#content').trigger("click");
		    	return;
		    } else if ($contentTypeItem.hasClass('contentTypeDraw')) {
		    	pageContentType = constContentTypeDraw;
		    } else if ($contentTypeItem.hasClass('contentTypeSpreadsheet')) {
		    	pageContentType = constContentTypeSpreadsheet;
		    } else if ($contentTypeItem.hasClass('contentTypeDoc')) {
		    	pageContentType = constContentTypeDoc;
		    } else if ($contentTypeItem.hasClass('contentTypeMxGraph')) {
		    	pageContentType = constContentTypeMxGraph;
		    }
			
			initContentView(pageContentType, null);	
		})
		
		

	}

	addSelectContentTypeModal();

	// function loadJS(jsFile, done)
	// {
	// 	$(function (d, s, id) {
	// 	    'use strict';

	// 	    var js, fjs = d.getElementsByTagName(s)[0];
	// 	    js = d.createElement(s);
	// 	    js.onload = function() {
	// 	      done();
	// 	    };
	// 	    js.src = jsFile;
	// 		js.setAttribute("crossorigin", "anonymous");
	// 	    fjs.parentNode.insertBefore(js, fjs);

	// 	}(document, 'script', 'forge'));	
	// }

	
	function initContentView(type, contentJSON)
	{
		function addContentSaveButton()
		{
			if ($('.btnContentSave').length) {
				return;
			}
			
			var htmlButton = `
				<div class="btnEditor btn btnFloatingCanvasSave btnFloating btnContentSave" style="">
					<i class="fa fa-check fa-2x" aria-hidden="true"></i>
				</div>
			`;
			$(".contentContainer").after( htmlButton );	
			$('.btnFloatingCanvasSave').css('right', $('.btnFloatingWrite').css('right'));

			$('.btnContentSave').click(function(e) {
				e.preventDefault();
				
				saveContent();
				
			});
		}	

		function loadCSS(href) 
		{
			var cssLink = $("<link>");
			$("head").append(cssLink);
			cssLink.attr({
				rel:  "stylesheet",
				type: "text/css",
				href: href
			});
		};

		function loadJS(jsFile, done)
		{
			$(function (d, s, id) {
			    'use strict';

			    var js, fjs = d.getElementsByTagName(s)[0];
			    js = d.createElement(s);
			    js.onload = function() {
			      done();
			    };
			    js.src = jsFile;
				js.setAttribute("crossorigin", "anonymous");
			    fjs.parentNode.insertBefore(js, fjs);

			}(document, 'script', 'forge'));	
		}

		showLoadingPage();

		if (pageContentType == constContentTypeWrite) {
			$('.froala-editor#content').html(contentJSON);	

			if (flgIsLoadingFromLocalStorage) {
        		$('.btnWrite.editControl#content').trigger( "click" );	
        	}			
		} else {
			$('.btnWrite.editControl#content').addClass('hidden');
			$('.btnWrite.btnEditor#content').addClass('hidden');		
			
			// $('.pageRow.editorRow').append('<button class="expandWidget">click me</button>');

			// $('.expandWidget').click(function(e) {
			// 	$('#contentsWrapper').toggleClass('fullscreen'); 
			// });

			//$('.pageRow.editorRow').append('<div class="wrapper"><div class="contentContainer"></div></div>');		
			$('.pageRow.editorRow').append('<div id="contentsWrapper"><div class="contentContainer"></div></div>');		

			addContentSaveButton();

			if (type == constContentTypeDraw) {
				loadCSS('/javascripts/literallycanvas/css/literallycanvas.css');

				loadJS("/javascripts/literallycanvas/js/react-with-addons.js", function() {
					loadJS("/javascripts/literallycanvas/js/react-dom.js", function() {
						loadJS("/javascripts/literallycanvas/js/literallycanvas.js", function() {
							//console.log('literallycanvas library is loaded...');
							$( ".contentContainer" ).attr('id', 'literallycanvas');
							lc = LC.init(
					            document.getElementsByClassName('contentContainer')[0], 
					            	{imageURLPrefix: '/javascripts/literallycanvas/img',
					            	backgroundColor: 'whitesmoke'}
					        );
					        //lc.loadSnapshotJSON('{"shapes":[],"colors":{"primary":"#000","secondary":"#fff","background":"black"}}');

					        if (contentJSON != null)
					        {
					        	lc.loadSnapshot(JSON.parse(contentJSON))
					        }
					        hideLoadingPage();
						});
					});
				});
			} else if (type == constContentTypeSpreadsheet) {
				
	    		loadCSS('https://kendo.cdn.telerik.com/2019.2.619/styles/kendo.common-material.min.css');
	    		loadCSS('https://kendo.cdn.telerik.com/2019.2.619/styles/kendo.rtl.min.css');
	    		loadCSS('https://kendo.cdn.telerik.com/2019.2.619/styles/kendo.material.min.css');
	    		loadCSS('https://kendo.cdn.telerik.com/2019.2.619/styles/kendo.material.mobile.min.css');
	    		//loadCSS('http://localhost:8000/javascripts/kendo/css/kendo.examples.css');
	    		loadCSS('/javascripts/kendo/css/kendo.examples.css');

				loadJS("https://kendo.cdn.telerik.com/2019.2.619/js/jszip.min.js", function() {
					loadJS("https://kendo.cdn.telerik.com/2019.2.619/js/kendo.all.min.js", function() {
						$( ".contentContainer" ).attr('id', 'spreadsheet');
						$('#spreadsheet').css('width', '100%');
						$("#spreadsheet").kendoSpreadsheet();
						spreadsheet = $("#spreadsheet").data("kendoSpreadsheet");

						if (contentJSON != null) {
							spreadsheet.fromJSON(JSON.parse(contentJSON));
						} 

						hideLoadingPage();
					});
				});				

			} else if (type == constContentTypeDoc) {
				syncfusionKey = itemId + 'SyncfusionWordContent';

				var template = `
					<div class="sample-browser" style="">
						<div class='content e-view'>
							<div class='sample-content'>
								<div class="control-content">
									<div class="container-fluid">
										<div class="control-section">
											<div class="control-section">
												<title>Essential JS 2 - DocumentEditor</title>
												<div id="panel">
													<div id="documenteditor_titlebar" class="e-de-ctn-title"></div>
													<div id="documenteditor_container_body" style="display: flex;position:relative; height:650px">
														<div id="container" style="width: 100%;height: 100%;"></div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				`;

				$(".contentContainer").css("border", "1px solid red;");
				$(".contentContainer").append(template);

				loadCSS('/javascripts/syncfusion/css/material.css');				
				loadCSS('/javascripts/syncfusion/css/docEditor.css');

				loadJS("/javascripts/syncfusion/js/ej2.min.js", function() {
					loadJS("/javascripts/syncfusion/js/docEditor.js", function() {
						$('.sample-browser').css('height', '690px')
						loadSyncfusionWordContent(contentJSON);
						hideLoadingPage();
					});

				});
			} else if (type == constContentTypeMxGraph) {
				$('.contentContainer').addClass('geEditor');
				$('.contentContainer').attr('id', 'editor-ui-container');
				//mxBasePath = 'http://localhost:8000/javascripts/mxGraph/mxClient';
				loadCSS('/javascripts/grapheditor/styles/grapheditor.css');

				loadJS('/javascripts/grapheditor/grapheditorOptions.js', function() {
				loadJS('/javascripts/grapheditor/js/Init.js', function() {
				loadJS('/javascripts/grapheditor/deflate/pako.min.js', function() {
				loadJS('/javascripts/grapheditor/deflate/base64.js', function() {
				loadJS('/javascripts/grapheditor/jscolor/jscolor.js', function() {
				loadJS('/javascripts/grapheditor/sanitizer/sanitizer.min.js', function() {
				//loadJS('/javascripts/grapheditor/src/js/mxClient.js', function() {
				loadJS('/javascripts/grapheditor/mxClient/mxClient.js', function() {
				loadJS('/javascripts/grapheditor/js/EditorUi.js', function() {
				loadJS('/javascripts/grapheditor/js/Editor.js', function() {
				loadJS('/javascripts/grapheditor/js/Sidebar.js', function() {
				loadJS('/javascripts/grapheditor/js/Graph.js', function() {
				loadJS('/javascripts/grapheditor/js/Format.js', function() {
				loadJS('/javascripts/grapheditor/js/Shapes.js', function() {
				loadJS('/javascripts/grapheditor/js/Actions.js', function() {
				loadJS('/javascripts/grapheditor/js/Menus.js', function() {
				loadJS('/javascripts/grapheditor/js/Toolbar.js', function() {
					loadJS('/javascripts/grapheditor/js/Dialogs.js', function() {
						loadJS('/javascripts/grapheditor/index.js', function() {
							if (contentJSON != null) {
								function loadMxGraphContent() {
									if (mxGraphUI == null) {
										setTimeout(loadMxGraphContent, 500);
									} else {
										window.onbeforeunload = null;
										//var doc = mxUtils.parseXml($.parseXML(contentJSON));
										var doc = mxUtils.parseXml(contentJSON);
										mxGraphUI.editor.setGraphXml(doc.documentElement);
									}
								}

								loadMxGraphContent();
							} 
							hideLoadingPage();
						});
					});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
				});
			}

			

		}
		
		//backupContentsInLocalStorage();				
	}

