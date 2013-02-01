window.presentation = {
    saveSvg: function(presentation_id, sheet_id, svg_data) {
        if(svg_data === undefined) {
            var svg = document.getElementById('svgcontent');
            var serializer = new XMLSerializer();
            var svg_data = serializer.serializeToString(svg);
        }
        
        jQuery.ajax({
            url: "ajax",
            data: "todo=store_svg_presentation&svg_data="+escape(svg_data)+'&presentation_id='+presentation_id+'&sheet_id='+sheet_id,
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