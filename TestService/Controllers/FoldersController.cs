using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace GVA.WorkSite.WebService.Controllers
{
    [RoutePrefix("api/folders")]
    public class FoldersController : ApiController
    {
        [Route("")]
        [HttpGet]
        public JToken Get()
        {
            return JArray.Parse(@"
[
    {
        ""id"" : ""1"",
        ""text"" : ""Node 1""
    },
    {
        ""id"" : ""2"",
        ""text"" : ""Folder 2"",
        ""children"" :
        [
            { ""id"" : ""3"", ""text"" : ""Node 2.1"" },
            { ""id"" : ""4"", ""text"" : ""Node 2.2"" }
        ]
    }
]"
            );
        }

        [Route("{id}")]
        [HttpGet]
        public JToken Get(int id)
        {
            return JArray.Parse(@"
[
    {
        ""id"" : ""1"",
        ""text"" : ""Node 1"",
    },
    {
        ""id"" : ""2"",
        ""text"" : ""Folder 2"",
        ""children"" :
        [
            { ""id"" : ""3"", ""text"" : ""Node 2.1"" },
            { ""id"" : ""4"", ""text"" : ""Node 2.2"" }
        ]
    }
]"
            );
        }

        [Route("{id}/summary")]
        [HttpGet]
        public JToken Summary(int id)
        {
            return JObject.Parse(@"
{
    ""id"" : ""!nrtdms:0:!session:LONDMS01:!database:WORKSITE:!folder:ordinary,6922"",
    ""name"" : ""Ford Motor Company"",
    ""prj_id"" : ""1080"",
    ""type"" : ""Workspace"",
    ""subfolders"" : ""6"",
    ""documents"" : ""27""
}
");
        }

        [Route("{id}/documents")]
        [HttpGet]
        public JToken Documents(int id)
        {
            return JArray.Parse(@"
[
    {
        ""docnum"" : ""445"",
        ""version"" : ""1"",
        ""description"" : ""DIWUG_SharePoint_eMagazine6""
    },
    {
        ""docnum"" : ""444"",
        ""version"" : ""1"",
        ""description"" : ""NLP test document""
    },
    {
        ""docnum"" : ""382"",
        ""version"" : ""1"",
        ""description"" : ""Sprint 2 tasks for review""
    },
    {
        ""docnum"" : ""381"",
        ""version"" : ""1"",
        ""description"" : ""SP2013Connect""
    },
    {
        ""docnum"" : ""380"",
        ""version"" : ""1"",
        ""description"" : ""SiteScoped""
    },
    {
        ""docnum"" : ""379"",
        ""version"" : ""1"",
        ""description"" : ""SharePoint 2013 Connect Tasks""
    }
]
");
        }
    }
}