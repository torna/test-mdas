window.board_manager = {
    init: function() {
        // binds events
        this.bindEvents();
    },
    bindEvents: function() {
        jQuery('#add_board').click(function(){
            window.board_manager.addBoard(jQuery('#board_types').val());
        });
    },
    addBoard: function(board_type) {
        if(jQuery('#board_'+board_type).length == 0) { // if board of this type does not exist
            var board_name = jQuery('#board_types option[value='+board_type+']').text();
            
            jQuery.ajax({
                url: "ajax",
                data: "todo=get_board&board="+board_type,
                type: "get",
                async: false,
                beforeSend: function() {
                    jQuery('#add_board').after(' <span id="loading_span">Loading...</span>');
                },
                success: function(data) {
                    jQuery('.learn_board').hide();
                    jQuery('#loading_span').remove(); // remove loader
                    jQuery('#boards').append(data);
                }
            });
            jQuery('#boards_tabs').append('<div id="tab_'+board_type+'" data-boardtype="'+board_type+'">'+board_name+'<sup>&nbsp;&nbsp;<a href="javascript:;" onclick="window.board_manager.deleteBoard(\''+board_type+'\')">x</a></sup></div>'); // append to tabs
            window.board_manager.bindBoardEvents(board_type);
            /**
             * @TODO
             * socket emit
             * save to localStorage
             */
        }
    },
    deleteBoard: function(board_type) {
        /**
         * @TODO
         * socket emit
         * save to localStorage
         */
        jQuery('#tab_'+board_type).remove(); // deleting board tab
        jQuery('#board_'+board_type).remove(); // deleting board containter
    },
    // when a new board is added bind events
    bindBoardEvents: function(board_type) {
        // general events
        // tab swither
        jQuery('#boards_tabs div').click(function() {
            var board = jQuery(this).attr('data-boardtype');
            jQuery('.active_learn_tab').removeClass('active_learn_tab'); // remove tab selection
            jQuery(this).addClass('active_learn_tab'); // setting the clicked tab active
            jQuery('.learn_board').hide(); // 
            jQuery('#board_'+board).show();
        });
        if(board_type == 'programming') {
            window.wb3.init();
            // create programming tab
            window.wb3.createTab('1', 'New file');
        }
    }
}