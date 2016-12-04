<?php

namespace AppBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class DocumentationController extends Controller
{
    /**
     * @Route("/")
     * @Template("AppBundle:content:index.html.twig")
     */
    public function indexAction(Request $request)
    {
        $response = new Response("<html><body><h1>Responsive Image Service</h1></body></html>");

        return [];
    }
}
