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
            var board_name = jQuery('#board_name').val();
            if(board_name == '') {
                alert('Please input the board name');
                return false;
            }
            jQuery('#boards_tabs').append('<div id="tab_'+board_type+'">'+board_name+'<sup>&nbsp;&nbsp;<a href="javascript:;" onclick="window.board_manager.deleteBoard(\''+board_type+'\')">x</a></sup></div>'); // append to tabs
            /**
             * @TODO
             * socket emit
             * save to localStorage
             */
        }
        jQuery('#board_name').val(''); // empty the board name
    },
    deleteBoard: function(board_id) {
        /**
         * @TODO
         * socket emit
         * save to localStorage
         */
    }
}