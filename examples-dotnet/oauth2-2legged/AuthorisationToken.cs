using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace oauth2_2legged
{
    public class AuthorisationToken
    {
        /// <summary>
        /// string with the access_token to be used for authenticating with APIs
        /// </summary>
        public string access_token { get; set; }
        /// <summary>
        /// type of the authorisation token e.g Bearer
        /// </summary>
        public string token_type { get; set; }
    }
}
