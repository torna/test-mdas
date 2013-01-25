window.presentation = {
    saveSvg: function(presentation_id, sheet_id, svg_data) {
        jQuery.ajax({
            url: "ajax",
            data: "todo=store_svg_presentation&svg_data="+svg_data+'&presentation_id='+presentation_id+'&sheet_id='+sheet_id,
            type: "post",
            async: false,
            beforeSend: function() {
                // loadior here
            },
            success: function(data) {
                alert('svg saved')
            }
        });
    }
}