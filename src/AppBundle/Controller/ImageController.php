<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

class ImageController extends Controller
{
    /**
     * @Route("/", name="images")
     */
    public function imageAction(Request $request)
    {
        $filterManager = $this->get('liip_imagine.filter.manager');
        $dataManager = $this->get('liip_imagine.data.manager');

        $filterConfiguration = $this->get('liip_imagine.filter.configuration');
        $filterConfiguration->set('test', array('data_loader' => 'stream_loader'));

        $binary = $dataManager->find('test', 'http://lorempixel.com/400/200/sports/1/');

        $contentLength = mb_strlen($binary->getContent());

        if ($contentLength === false) {
            throw new HttpException(503, "Unable to download source file.");
        }

        $response = new Response($binary->getContent());
        $response->headers->set('Content-Type', $binary->getMimeType());
        $response->headers->set('Connection', 'Keep-Alive');
        $response->headers->set('Accept-Ranges', 'bytes');
        return $response;
    }
}
