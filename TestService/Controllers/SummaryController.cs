using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;

namespace TestService.Controllers
{
    public class SummaryController : ApiController
    {
        // GET api/summary/5
        public JToken Get(int id)
        {
            return JObject.Parse(
                @"{
                    'id' : '!nrtdms:0:!session:LONDMS01:!database:WORKSITE:!folder:ordinary,6922',
                    'name' : 'Ford Motor Company',
                    'prj_id' : '1080',
                    'type' : 'Workspace',
                    'subfolders' : '6',
                    'documents' : '27'
                }");
        }
    }
}
