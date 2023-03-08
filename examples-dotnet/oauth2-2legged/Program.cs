using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace oauth2_2legged
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var authenticator = new Authenticator();
            var accessToken = await authenticator.Authenticate();
        }
    }

}
