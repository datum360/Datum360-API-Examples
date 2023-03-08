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
    public class Authenticator
    {
        /// <summary>
        /// Authenticates with a target system
        /// </summary>
        /// <returns>An authorisation token with the token sting and token type e.g 'Bearer'</returns>
        public async Task<AuthorisationToken> Authenticate(){
            var httpClient = new HttpClient();

            var requestMessage = new HttpRequestMessage()
            {
                RequestUri = new Uri("https://example-system.acl360.io/oauth2/token"),
                Method = HttpMethod.Post
            };

            requestMessage.Content = JsonContent.Create(new
            {
                grant_type = "client_credentials",
                client_id = "username",
                client_secret = "password",
                scope = "example-system-pim360" //example-system should match the service name listed in ACL360, and while genrally match the URL
                                                //e.g https://example-system.pim360.io == example-system-pim360
            });

            HttpResponseMessage httpResponse = await httpClient.SendAsync(requestMessage);
            string content = await httpResponse.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<AuthorisationToken>(content);
        }
    }
}
