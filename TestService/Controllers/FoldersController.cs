using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace TestService.Controllers
{
    public class FoldersController : ApiController
    {
        //// GET api/<controller>
        public JToken Get()
        {
            return JArray.Parse(@"
[
    {
        'title' : 'Node 1',
        'key' : '1'
    },
    {
        'title' : 'Folder 2',
        'key' : '2',
        'folder' : true,
        'children' :
        [
            { 'title' : 'Node 2.1', 'key' : '3' },
            { 'title' : 'Node 2.2', 'key' : '4' }
        ]
    }
]"
            );
        }

        // GET api/<controller>/5
        public JToken Get(int id)
        {
            return JArray.Parse(@"
[
    {
        'title' : 'Node 1',
        'key' : '1'
    },
    {
        'title' : 'Folder 2',
        'key' : '2',
        'folder' : true,
        'children' :
        [
            { 'title' : 'Node 2.1', 'key' : '3' },
            { 'title' : 'Node 2.2', 'key' : '4' }
        ]
    }
]"
            );
        }

        // POST api/<controller>
        public void Post([FromBody]string value)
        {
        }

        // PUT api/<controller>/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/<controller>/5
        public void Delete(int id)
        {
        }
    }
}