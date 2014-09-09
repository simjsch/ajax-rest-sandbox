$(function () {
    var $loading = $('#loading').hide();
    $(document)
        .ajaxStart(function () {
            $loading.show();
        })
        .ajaxStop(function () {
            $loading.hide();
        });

    WorkSiteBrowser.Init();

    $("#browse").click(function () {
        var folders = WorkSiteBrowser.SelectFolders();

        if (folders) {
            if (0 === $("#folder-template").length) {
                var path = '//' + location.host + location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/FolderTemplate.html";

                $.ajax({
                    async: false,
                    type: 'GET',
                    url: path,
                    success: function (data) {
                        $(data).appendTo("body");
                    }
                });
            }
            WorkSiteFolders.Insert(folders);
        }
    });
});

var WorkSiteFolders = function () {
    var _updatePostData = function () {
        //var params = {};
        //$("#aspnetForm").find("input")
        //                  .filter("[id^='hdn-objectid-'],[id^='hdn-description-'],[id^='hdn-type-'],[id^='chk-latest-']")
        //                  .each(function (i, e) {
        //                      params[e.id] = e.value;
        //                  });
        //$("#ctl00_PlaceHolderMain_hdnFormData").val($.param(params));
    }

    var _loadSummary = function (index) {
        //$("#main div.row").last();

        var path = "http://localhost/TestService/api/summary/5";

        $.ajax({
            async: false,
            type: 'GET',
            url: path,
            dataType: 'json',
            success: function (summary) {
                var temp = $("#folder-template").html();

                $("#folder-template").find("#id-" + index).text(summary.prj_id);
                $("#folder-template").find("#name-" + index).text(summary.name);
                $("#folder-template").find("#type-" + index).text(summary.type);
                $("#folder-template").find("#subfolders-" + index).text(summary.subfolders);
                $("#folder-template").find("#documents-" + index).text(summary.documents);
            }
        });

    }

    var _insert = function (folders) {
        $.each(folders, function (i, e) {
            $("#main").append(function () {
                var indexOld = 0;
                var exists = false;
                var currentFolders = $("#main").find("input[id^='hdn-objectid-']");
                currentFolders.each(function () {
                    var id = this.id.replace("hdn-objectid-", "");
                    indexOld = Math.max(indexOld, parseInt(id));
                    if (e === this.value) exists = true;
                });

                if (!exists) {
                    var index = indexOld + 1;

                    var temp = $("#folder-template").html();

                    $("#folder-template").find("#id-" + indexOld).attr("id", "id-" + index);
                    $("#folder-template").find("#name-" + indexOld).attr("id", "name-" + index);
                    $("#folder-template").find("#type-" + indexOld).attr("id", "type-" + index);
                    $("#folder-template").find("#subfolders-" + indexOld).attr("id", "subfolders-" + index);
                    $("#folder-template").find("#documents-" + indexOld).attr("id", "documents-" + index);
                    $("#folder-template").find("#hdn-objectid-" + indexOld).attr("id", "hdn-objectid-" + index);
                    $("#folder-template").find("#btn-remove-" + indexOld).attr("id", "btn-remove-" + index);
                    _loadSummary(index);

                    $("#folder-template").find("#hdn-objectid-" + index).attr("value", e);
                    $("#folder-template").find("#btn-remove-" + index).attr("onClick", "WorkSiteFolders.Remove(this.id);");
                    $("#folder-template").find("#name-" + index).text(e);
                    return $("#folder-template").html();
                }
            });
        });
    }

    var _remove = function (id) {
        var index = id.replace("btn-remove-", "");
        var panel = $("#main").find("#hdn-objectid-" + index).closest("div.row");
        panel.fadeOut("slow", function () {
            panel.remove();
        });
    }

    return {
        Insert: function (folders) {
            _insert(folders);
            _updatePostData();
        },

        Remove: function (id) {
            _remove(id);
            _updatePostData();
        }
    }
}();